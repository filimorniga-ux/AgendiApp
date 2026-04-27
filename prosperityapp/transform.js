export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let hasUseData = false;

  // Encontrar importación de useData
  root.find(j.ImportDeclaration).forEach(path => {
    if (path.node.source.value.includes('DataContext')) {
      const specifiers = path.node.specifiers;
      if (specifiers && specifiers.some(s => s.imported && s.imported.name === 'useData')) {
        hasUseData = true;
        // Eliminar el specifier useData o remover la importación entera si es la única
        path.node.specifiers = specifiers.filter(s => s.imported.name !== 'useData');
        if (path.node.specifiers.length === 0) {
          j(path).remove();
        }
      }
    }
  });

  if (!hasUseData) return root.toSource();

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

  const globalNeededHooks = new Set();
  
  // Buscar const { ... } = useData();
  root.find(j.VariableDeclarator, {
    init: {
      type: 'CallExpression',
      callee: { name: 'useData' }
    }
  }).forEach(path => {
    const id = path.node.id;
    if (id.type !== 'ObjectPattern') return;

    let needsIsLoading = false;
    let needsError = false;
    const replacementsByHook = {};
    const localNeededHooks = new Set();

    id.properties.forEach(prop => {
      if (prop.type === 'Property') {
        const key = prop.key.name;
        const alias = prop.value.name;

        if (key === 'isLoading') {
          needsIsLoading = alias;
          return;
        }
        if (key === 'error') {
          needsError = alias;
          return;
        }

        const hook = hookMap[key];
        if (hook) {
          localNeededHooks.add(hook);
          globalNeededHooks.add(hook);
          if (!replacementsByHook[hook]) replacementsByHook[hook] = [];
          replacementsByHook[hook].push({ key, alias });
        }
      } else if (prop.type === 'RestElement') {
        // Ignorar rest elements o procesarlos? Por ahora ignorar
      }
    });

    const newDeclarations = [];
    const loadingVars = [];
    const errorVars = [];

    for (const hook of localNeededHooks) {
      const isConfigOrRoleOrBusiness = ['useAppConfig', 'useRole', 'useBusiness'].includes(hook);
      
      const properties = replacementsByHook[hook].map(item => {
        const p = j.property('init', j.identifier(item.key), j.identifier(item.alias));
        p.shorthand = item.key === item.alias;
        return p;
      });

      if (!isConfigOrRoleOrBusiness || hook === 'useAppConfig') {
        if (needsIsLoading || needsError) {
          const suffix = hook.replace('use', '');
          const loadingAlias = `loading${suffix}`;
          const errorAlias = `error${suffix}`;
          loadingVars.push(loadingAlias);
          errorVars.push(errorAlias);

          if (needsIsLoading) {
            const p = j.property('init', j.identifier('loading'), j.identifier(loadingAlias));
            properties.push(p);
          }
          if (needsError) {
            const p = j.property('init', j.identifier('error'), j.identifier(errorAlias));
            properties.push(p);
          }
        }
      }

      const declarator = j.variableDeclarator(
        j.objectPattern(properties),
        j.callExpression(j.identifier(hook), [])
      );
      newDeclarations.push(j.variableDeclaration('const', [declarator]));
    }

    if (needsIsLoading) {
      const init = loadingVars.length > 0 
        ? loadingVars.map(v => j.identifier(v)).reduce((left, right) => j.logicalExpression('||', left, right))
        : j.booleanLiteral(false);
      newDeclarations.push(j.variableDeclaration('const', [j.variableDeclarator(j.identifier(needsIsLoading), init)]));
    }

    if (needsError) {
      const init = errorVars.length > 0 
        ? errorVars.map(v => j.identifier(v)).reduce((left, right) => j.logicalExpression('||', left, right))
        : j.literal(null);
      newDeclarations.push(j.variableDeclaration('const', [j.variableDeclarator(j.identifier(needsError), init)]));
    }

    j(path).closest(j.VariableDeclaration).replaceWith(newDeclarations);
  });

  // Injectar imports
  if (globalNeededHooks.size > 0) {
    const p = require('path');
    const relativeToSrc = p.relative(p.dirname(file.path), p.join(process.cwd(), 'src'));
    const prefix = relativeToSrc === '' ? '.' : relativeToSrc;

    // Encontrar el último import
    const imports = root.find(j.ImportDeclaration);
    const existingImports = new Set();
    imports.forEach(i => {
      i.node.specifiers.forEach(s => {
        if (s.imported) existingImports.add(s.imported.name);
      });
    });

    const newImports = Array.from(globalNeededHooks)
      .filter(hook => !existingImports.has(hook))
      .map(hook => {
        return j.importDeclaration(
          [j.importSpecifier(j.identifier(hook))],
          j.literal(`${prefix}/${contextPaths[hook]}`)
        );
      });

    if (newImports.length > 0) {
      if (imports.length > 0) {
        j(imports.at(-1).get()).insertAfter(newImports);
      } else {
        root.get().node.program.body.unshift(...newImports);
      }
    }
  }

  return root.toSource({ quote: 'single' });
}
