import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

const hookMap = {
  clients: 'useClients',
  collaborators: 'useCollaborators',
  services: 'useServices',
  technicalInventory: 'useInventory',
  retailInventory: 'useInventory',
  movements: 'useMovements',
  appointments: 'useAppointments',
  config: 'useAppConfig',
  currentLocale: 'useAppConfig',
  currentCurrencySymbol: 'useAppConfig',
  setCurrentCurrency: 'useAppConfig',
  brandName: 'useAppConfig',
  logoUrl: 'useAppConfig',
  userRole: 'useRole',
  simulatedRole: 'useRole',
  realRole: 'useRole',
  updateRoleSimulation: 'useRole',
  user: 'useBusiness',
  loadingAuth: 'useBusiness',
  businessId: 'useBusiness'
};

const contextPaths = {
  useClients: 'context/collections/ClientsContext',
  useCollaborators: 'context/collections/CollaboratorsContext',
  useServices: 'context/collections/ServicesContext',
  useInventory: 'context/collections/InventoryContext',
  useMovements: 'context/collections/MovementsContext',
  useAppointments: 'context/collections/AppointmentsContext',
  useAppConfig: 'context/collections/ConfigContext',
  useRole: 'context/collections/RoleContext',
  useBusiness: 'context/BusinessContext'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if it uses useData
  if (!content.includes('useData')) return;

  console.log('Processing:', filePath);

  // 1. Remove import { useData } from ...
  const importUseDataRegex = /import\s+\{[^}]*useData[^}]*\}\s+from\s+['"][^'"]+DataContext['"];?\n?/g;
  content = content.replace(importUseDataRegex, '');

  // 2. Find const { ... } = useData();
  const useDataCallRegex = /const\s+\{([\s\S]*?)\}\s*=\s*useData\(\);/g;
  let match;
  let hasChanges = false;
  
  while ((match = useDataCallRegex.exec(content)) !== null) {
    hasChanges = true;
    const destructureBlock = match[1];
    
    // Parse variables
    const vars = destructureBlock.split(',').map(s => s.trim()).filter(Boolean);
    
    const neededHooks = new Set();
    const replacementsByHook = {};
    let needsIsLoading = false;
    let needsError = false;

    vars.forEach(v => {
      // Handle aliases e.g. "technicalInventory: tech"
      const parts = v.split(':').map(s => s.trim());
      const originalKey = parts[0];
      const alias = parts[1] || parts[0];

      if (originalKey === 'isLoading') {
        needsIsLoading = true;
        return;
      }
      if (originalKey === 'error') {
        needsError = true;
        return;
      }

      const hook = hookMap[originalKey];
      if (hook) {
        neededHooks.add(hook);
        if (!replacementsByHook[hook]) replacementsByHook[hook] = [];
        replacementsByHook[hook].push(v);
      } else {
        console.warn(`Unknown variable ${originalKey} in ${filePath}`);
      }
    });

    // Generate new statements
    let newStatements = [];
    const loadingVars = [];
    const errorVars = [];

    for (const hook of neededHooks) {
      const isConfigOrRoleOrBusiness = ['useAppConfig', 'useRole', 'useBusiness'].includes(hook);
      
      const varsToExtract = [...replacementsByHook[hook]];
      
      if (!isConfigOrRoleOrBusiness) {
        if (needsIsLoading || needsError) {
          const loadingAlias = `loading${hook.replace('use', '')}`;
          const errorAlias = `error${hook.replace('use', '')}`;
          loadingVars.push(loadingAlias);
          errorVars.push(errorAlias);
          if (needsIsLoading) varsToExtract.push(`loading: ${loadingAlias}`);
          if (needsError) varsToExtract.push(`error: ${errorAlias}`);
        }
      } else if (hook === 'useAppConfig') {
        // useAppConfig also has loading and error
        if (needsIsLoading || needsError) {
          const loadingAlias = `loadingConfig`;
          const errorAlias = `errorConfig`;
          loadingVars.push(loadingAlias);
          errorVars.push(errorAlias);
          if (needsIsLoading) varsToExtract.push(`loading: ${loadingAlias}`);
          if (needsError) varsToExtract.push(`error: ${errorAlias}`);
        }
      }
      
      newStatements.push(`const { ${varsToExtract.join(', ')} } = ${hook}();`);
    }

    if (needsIsLoading && loadingVars.length > 0) {
      newStatements.push(`const isLoading = ${loadingVars.join(' || ')};`);
    } else if (needsIsLoading && loadingVars.length === 0) {
      newStatements.push(`const isLoading = false;`);
    }

    if (needsError && errorVars.length > 0) {
      newStatements.push(`const error = ${errorVars.join(' || ')};`);
    } else if (needsError && errorVars.length === 0) {
      newStatements.push(`const error = null;`);
    }

    // Replace the matched useData() block with the new statements
    content = content.replace(match[0], newStatements.join('\n  '));

    // Inject imports based on neededHooks
    // Find the depth to src to construct relative paths properly
    const relativeToSrc = path.relative(path.dirname(filePath), srcDir);
    const prefix = relativeToSrc === '' ? '.' : relativeToSrc;

    let importStatements = [];
    for (const hook of neededHooks) {
      // Check if import already exists
      if (!content.includes(`import { ${hook} }`)) {
        // e.g. import { useClients } from '../../context/collections/ClientsContext';
        importStatements.push(`import { ${hook} } from '${prefix}/${contextPaths[hook]}';`);
      }
    }

    if (importStatements.length > 0) {
      // Find last import
      const lastImportMatch = [...content.matchAll(/^import.*?;/gm)].pop();
      if (lastImportMatch) {
        const insertionIndex = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertionIndex) + '\n' + importStatements.join('\n') + content.slice(insertionIndex);
      } else {
        content = importStatements.join('\n') + '\n' + content;
      }
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      // Skip context files
      if (!fullPath.includes('src/context/DataContext') && !fullPath.includes('src/context/collections') && !fullPath.includes('src/context/BusinessContext')) {
        processFile(fullPath);
      }
    }
  }
}

traverseDir(srcDir);
console.log('Refactoring complete.');
