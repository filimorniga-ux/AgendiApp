const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-bg-main text-text-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-bg-secondary p-8 rounded-2xl border border-border-main shadow-xl">
        <h1 className="text-3xl font-bold mb-8 text-accent text-center">Condiciones del Servicio</h1>
        <div className="space-y-6 text-text-secondary leading-relaxed">
          <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>
          <p>
            Al utilizar AgendiApp y nuestros servicios de agendamiento a través de WhatsApp, 
            usted acepta los presentes Términos y Condiciones.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">1. Uso del Servicio</h2>
          <p>
            AgendiApp es una plataforma que facilita la gestión y reserva de citas utilizando asistentes virtuales 
            mediante WhatsApp. El usuario se compromete a utilizar el servicio con fines lícitos, proporcionando datos reales, y exclusivamente para 
            gestionar sus reservas o interactuar con los negocios afiliados.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">2. Responsabilidad de la Cuenta</h2>
          <p>
            Usted es responsable de la confidencialidad y el uso de su dispositivo y cuenta de WhatsApp. 
            Las reservas realizadas a través de su número de teléfono se considerarán como válidas y autorizadas por usted. 
            Cualquier uso indebido, envío de spam, o intento de vulnerar el sistema resultará en el bloqueo definitivo del servicio.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">3. Políticas de Cancelación y Negocios Afiliados</h2>
          <p>
            La cancelación, reprogramación de citas y la prestación final del servicio están sujetas exclusivamente a las políticas de cada negocio 
            asociado que utilice AgendiApp. Nosotros proveemos únicamente la plataforma tecnológica de reservas y no nos hacemos responsables de la calidad del servicio final prestado por terceros.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">4. Limitación de Responsabilidad</h2>
          <p>
            AgendiApp no se hace responsable por caídas temporales del servicio de mensajería (Meta/WhatsApp), fallos de red, ni por la indisponibilidad 
            de los negocios afiliados. Actuamos únicamente como un puente tecnológico e intentamos asegurar una disponibilidad del sistema óptima.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">5. Privacidad y Datos Personales</h2>
          <p>
            El uso del servicio también está regido por nuestra Política de Privacidad, en la cual detallamos cómo 
            protegemos y manejamos su información de contacto y sus historiales de reserva.
          </p>

          <h2 className="text-xl font-semibold text-text-main mt-8">6. Cambios en las Condiciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento para reflejar cambios en la plataforma o por requerimientos legales. El uso continuado del 
            servicio después de realizar dichas modificaciones constituye su aceptación de los nuevos términos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
