const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-bg-main text-text-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-bg-secondary p-8 rounded-2xl border border-border-main shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-accent text-center">Política de Privacidad</h1>
        <div className="space-y-6 text-text-secondary leading-relaxed">
          <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>
          <p>
            En AgendiApp, valoramos su privacidad. Esta Política de Privacidad describe cómo recopilamos, 
            utilizamos, y protegemos su información personal cuando utiliza nuestra plataforma y nuestro 
            bot de WhatsApp.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">1. Información que Recopilamos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Información de Contacto:</strong> Su número de teléfono (obtenido a través de WhatsApp), nombre y correo electrónico (si se proporciona).</li>
            <li><strong>Datos de Citas:</strong> Historial de reservas, servicios seleccionados y fechas.</li>
            <li><strong>Interacciones:</strong> Registros de mensajes enviados a nuestro bot de WhatsApp con el fin de proporcionar el servicio de agendamiento.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text-main mt-8">2. Cómo Utilizamos la Información</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Para agendar, gestionar y recordar sus citas médicas o de servicios.</li>
            <li>Para comunicarnos con usted en relación a sus reservas a través de WhatsApp.</li>
            <li>Para operar y mejorar nuestros servicios y la IA que asiste en el proceso de agendamiento.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text-main mt-8">3. Compartir Información y Meta (WhatsApp)</h2>
          <p>
            No vendemos ni compartimos su información personal con terceros para fines de marketing o publicidad. 
            Para proveer el servicio, la información fluye a través de la infraestructura de <strong>Meta (WhatsApp Business API)</strong> para poder enviar y recibir los mensajes, operando bajo las estrictas políticas de privacidad de Meta. 
            Solo almacenamos en nuestros servidores (Supabase) los datos necesarios para la gestión de su agenda.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">4. Seguridad</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas estándar de la industria, 
            encriptando los datos en tránsito y limitando el acceso solo al personal autorizado, 
            para evitar accesos no autorizados a su información de reservas.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">5. Sus Derechos</h2>
          <p>
            Usted tiene derecho a solicitar el acceso, rectificación o eliminación de sus datos personales 
            en cualquier momento. Para conocer cómo eliminar sus datos, por favor consulte nuestra página de eliminación de datos.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">6. Contacto</h2>
          <p>
            Si tiene dudas sobre esta política, puede contactarnos a través del número de WhatsApp oficial de nuestro servicio o escribiendo a <strong>soporte@agendiapp.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
