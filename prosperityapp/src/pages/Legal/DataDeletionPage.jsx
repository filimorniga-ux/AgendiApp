const DataDeletionPage = () => {
  return (
    <div className="min-h-screen bg-bg-main text-text-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-bg-secondary p-8 rounded-2xl border border-border-main shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-accent text-center">Instrucciones para la Eliminación de Datos</h1>
        <div className="space-y-6 text-text-secondary leading-relaxed">
          <p>
            En AgendiApp, usted tiene pleno control sobre sus datos personales. Si desea que eliminemos 
            toda su información de nuestra plataforma en cumplimiento con las regulaciones de privacidad, por favor siga las instrucciones a continuación.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">¿Qué datos se eliminarán?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Su número de teléfono asociado en nuestro sistema.</li>
            <li>Su nombre registrado y cualquier otro dato de contacto.</li>
            <li>El historial completo de sus citas y reservas en nuestra plataforma.</li>
            <li>Todos los registros de interacciones y chats previos con nuestro bot de IA en WhatsApp.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text-main mt-8">¿Cómo solicitar la eliminación?</h2>
          <p>Para solicitar la eliminación permanente de sus datos, usted puede hacerlo a través de los siguientes métodos:</p>
          
          <div className="bg-bg-main p-6 rounded-lg border border-border-main mt-4">
            <h3 className="font-semibold text-text-main mb-2">Método 1: Vía WhatsApp (Forma más rápida)</h3>
            <p>
              Envíe un mensaje con la palabra <strong>"ELIMINAR MIS DATOS"</strong> al mismo número de WhatsApp 
              con el cual ha realizado sus reservas. Nuestro sistema automático o equipo de soporte validará su número y procesará la solicitud de borrado.
            </p>
          </div>

          <div className="bg-bg-main p-6 rounded-lg border border-border-main mt-4">
            <h3 className="font-semibold text-text-main mb-2">Método 2: Vía Correo Electrónico</h3>
            <p>
              Envíe un correo electrónico a <strong>soporte@agendiapp.com</strong> solicitando la eliminación de sus datos. 
              Por favor, asegúrese de incluir en el cuerpo del correo su <strong>número de teléfono exacto (incluyendo el código de país, ej. +57...)</strong> asociado a sus reservas. Si no incluye el número de teléfono, no podremos ubicar sus registros.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-text-main mt-8">Tiempo de Procesamiento y Confirmación</h2>
          <p>
            Su solicitud de eliminación será procesada en un plazo máximo de <strong>15 a 30 días hábiles</strong> desde el momento de la recepción. 
            Una vez que sus datos hayan sido purgados definitivamente de nuestros servidores (y respaldos, si aplica), usted recibirá una confirmación por la misma vía en la que hizo la solicitud.
          </p>
          
          <p className="mt-4 text-sm opacity-80">
            * Nota: Tenga en cuenta que al eliminar sus datos, ya no podrá acceder al historial de sus citas. Si decide usar AgendiApp en el futuro, deberá registrarse como un usuario nuevo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage;
