export type Language = 'es' | 'en';
export type UserRole = 'admin' | 'staff' | 'client';

export const translations = {
    es: {
        nav: {
            features: "Tecnología",
            ecosystem: "Ecosistema",
            pricing: "Precios",
            tutorials: "Tutoriales",
            contact: "Contacto",
            login: "Iniciar Sesión",
            register: "Ver Planes y Precios",
            logout: "Salir",
            dashboard: "Panel"
        },
        hero: {
            title: "El Sistema Operativo para Salones del Futuro",
            subtitle: "No es solo una agenda. Es inteligencia de negocio. Controla costos gramo a gramo, gestiona stock dual y automatiza tu flujo de caja.",
            cta_primary: "Prueba de Rentabilidad Gratis",
            cta_secondary: "Ver Demo Técnica"
        },
        bento: {
            title: "Nuestra Tecnología",
            subtitle: "Deep Logic: Rentabilidad en cada Pixel",
            calc_title: "Calculadora Técnica",
            calc_desc: "Automatiza el cálculo de costos de servicios (tintes, etc.) para asegurar rentabilidad. Suma gramos exactos.",
            stock_title: "Control de Stock Dual",
            stock_desc: "Diferencia entre stock de venta (retail) y stock técnico (consumo interno). Se descuenta automáticamente con la calculadora.",
            tips_title: "Gestión de Propinas",
            tips_desc: "Asignación, acumulación y reportes de propinas digitales por estilista de forma transparente.",
            gift_title: "Gift Cards & Wallet",
            gift_desc: "Genera flujo de caja inmediato. Rastreo de saldos y expiración sin errores manuales.",
            agenda_title: "Agenda Inteligente",
            agenda_desc: "Recordatorios automáticos (WhatsApp) y bloqueo de clientes problemáticos para reducir 'no-shows'."
        },
        ecosystem: {
            title: "Matriz de Descargas",
            subtitle: "Potencia nativa en cualquier dispositivo.",
            role_admin: "Admin: Control Total",
            role_staff: "Staff: Agenda & Tips",
            role_client: "Cliente: Reservas 24/7"
        },
        tutorials: {
            title: "Academia AgendiApp",
            subtitle: "Domina las 14 funciones clave con nuestros expertos.",
            watch_btn: "Ver Tutorial",
            list: [
                { title: "01. Configuración Inicial del Salón", desc: "Define horarios, logo y datos fiscales." },
                { title: "02. Gestión de Staff y Permisos", desc: "Crea perfiles, niveles de acceso y comisiones." },
                { title: "03. Crear y Editar Citas", desc: "Flujo rápido de agenda y re-agendamiento." },
                { title: "04. Calculadora de Costos Técnicos", desc: "Cómo pesar gramos y descontar stock real." },
                { title: "05. Carga de Inventario", desc: "Altas, bajas y proveedores." },
                { title: "06. Stock Retail vs Técnico", desc: "Diferencia entre lo que vendes y lo que usas." },
                { title: "07. Cierre de Caja Diario", desc: "Arqueo de efectivo, tarjeta y diferencias." },
                { title: "08. Gestión de Propinas", desc: "Reportes de propinas por estilista." },
                { title: "09. CRM: Base de Datos Clientes", desc: "Historial, fórmulas guardadas y notas." },
                { title: "10. Recordatorios WhatsApp", desc: "Configura mensajes automáticos." },
                { title: "11. Gift Cards y Monederos", desc: "Venta, redención y seguimiento de saldo." },
                { title: "12. Nóminas Automáticas", desc: "Cálculo de sueldos base + comisiones." },
                { title: "13. App para Clientes", desc: "Cómo tus clientes reservan online." },
                { title: "14. Soporte y Ayuda", desc: "Contactar a ingeniería ante fallos." }
            ]
        },
        pricing: {
            title: "Inversión Inteligente",
            subtitle: "Modelo de penetración de mercado. Precios diseñados para escalar.",
            monthly_equiv: "/ mes",
            billed_at: "facturado cada",
            save: "Ahorras",
            cycles: {
                monthly: "Mensual",
                quarterly: "Trimestral",
                biannual: "Semestral",
                annual: "Anual"
            },
            plan_basic: "Agendiapp Salón",
            plan_pro: "Agendiapp Pro",
            desc_basic: "Gestión diaria completa.",
            desc_pro: "Crecimiento y control total.",
            features_basic: [
                "Colaboradores Ilimitados",
                "Gestión de Citas y Agenda",
                "CRM de Clientes",
                "Punto de Venta (POS) Básico"
            ],
            features_pro: [
                "Todo lo del plan Salón",
                "Control de Inventario (Técnico y Retail)",
                "Nóminas y Comisiones Automáticas",
                "Reportes Financieros Avanzados",
                "Soporte Prioritario"
            ],
            cta_basic: "Elegir Plan Salón",
            cta_pro: "Elegir Plan Pro"
        },
        testimonials: {
            title: "Resultados Reales",
            subtitle: "Historias de dueños que recuperaron el control.",
            list: [
                { name: "Valeria M.", salon: "Studio 54 Hair", text: "Antes perdía el 20% de mis ingresos en 'producto desperdiciado' o robado. Con la calculadora de gramos, recuperé mi margen y sé exactamente qué gasta cada estilista." },
                { name: "Roberto F.", salon: "Barber King Chain", text: "Tengo 3 sucursales. Poder ver el cierre de caja de todas en tiempo real desde mi celular no tiene precio. AgendiApp es el cerebro financiero de mi negocio." },
                { name: "Jessica P.", salon: "Lashes & Brows", text: "El sistema de depósitos automáticos eliminó por completo a las clientas que reservaban y no llegaban. Pasé de 15% de ausencias a 0% en un mes." },
                { name: "Carlos R.", salon: "Royal Barbershop", text: "El control de inventario técnico es lo mejor. Sé exactamente cuánto producto uso por servicio y cuándo reponer. Ya no me quedo sin cera ni gel." },
                { name: "Sofía L.", salon: "Beauty Spa", text: "Manejo a 5 estilistas. El reporte de comisiones automático al final del día me ahorra horas de calculadora y discusiones sobre 'quién hizo qué'." },
                { name: "Andrea D.", salon: "Colorist Expert", text: "Mis clientes aman la app de reservas. Dicen que es más fácil que llamar, y yo ya no paso el domingo contestando WhatsApps para agendar la semana." }
            ]
        },
        contact: {
            title: "¿Preguntas?",
            subtitle: "Nuestro equipo de soporte habla tu idioma.",
            name: "Nombre",
            email: "Correo Electrónico",
            message: "Mensaje",
            submit: "Enviar Mensaje"
        },
        auth: {
            login_title: "Acceder al Panel",
            register_title: "Crear Cuenta Maestra",
            email: "Correo Electrónico",
            pass: "Contraseña",
            submit_login: "Entrar",
            submit_register: "Registrar Negocio",
            google: "Continuar con Google",
            apple: "Continuar con Apple",
            switch_reg: "¿No tienes cuenta? Regístrate",
            switch_log: "¿Ya tienes cuenta? Inicia Sesión",
            error_generic: "Ocurrió un error. Verifica tus datos."
        },
        dashboard: {
            welcome: "Bienvenido,",
            role_switcher: "Simular Rol:",
            roles: {
                admin: "Administrador",
                staff: "Colaborador",
                client: "Cliente"
            },
            admin_section: {
                revenue: "Ingresos (Hoy)",
                pin_control: "PIN Maestro de Seguridad",
                pin_desc: "Autorizar descuentos y borrar citas.",
                manage_staff: "Gestión de Personal",
                all_calendars: "Ver Todos los Calendarios",
                simulate_sale: "Simular Venta (+ $45)"
            },
            staff_section: {
                my_commissions: "Mis Comisiones (Hoy)",
                my_schedule: "Mi Agenda",
                product_list: "Lista de Precios",
                cost_price: "P. Costo",
                retail_price: "P. Venta",
                profit: "Margen"
            },
            client_section: {
                book_now: "Reservar Cita",
                loyalty: "Mis Puntos",
                promotions: "Promociones Activas",
                history: "My Historial"
            }
        }
    },
    en: {
        nav: {
            features: "Technology",
            ecosystem: "Ecosystem",
            pricing: "Pricing",
            tutorials: "Tutorials",
            contact: "Contact",
            login: "Login",
            register: "View Plans & Pricing",
            logout: "Logout",
            dashboard: "Dashboard"
        },
        hero: {
            title: "The Operating System for Future Salons",
            subtitle: "Not just a calendar. It's business intelligence. Control costs gram by gram, manage dual stock, and automate your cash flow.",
            cta_primary: "Start Profitability Trial",
            cta_secondary: "View Tech Demo"
        },
        bento: {
            title: "Our Technology",
            subtitle: "Deep Logic: Profitability in Every Pixel",
            calc_title: "Technical Calculator",
            calc_desc: "Automate cost calculations (dyes, etc.) to ensure profitability. Track exact grams used.",
            stock_title: "Dual Stock Control",
            stock_desc: "Distinguish between retail and technical (internal use) stock. Automatically deducted by the calculator.",
            tips_title: "Tip Management",
            tips_desc: "Transparent digital tip allocation, accumulation, and reporting per stylist.",
            gift_title: "Gift Cards & Wallet",
            gift_desc: "Generate immediate cash flow. Track balances and expiration dates without manual errors.",
            agenda_title: "Smart Agenda",
            agenda_desc: "Automated WhatsApp reminders and blocking of problematic clients to reduce 'no-shows'."
        },
        ecosystem: {
            title: "Download Matrix",
            subtitle: "Native power on any device.",
            role_admin: "Admin: Total Control",
            role_staff: "Staff: Agenda & Tips",
            role_client: "Client: 24/7 Booking"
        },
        tutorials: {
            title: "AgendiApp Academy",
            subtitle: "Master the 14 key functions with our experts.",
            watch_btn: "Watch Tutorial",
            list: [
                { title: "01. Initial Salon Setup", desc: "Define schedules, logo, and tax data." },
                { title: "02. Staff & Permissions Management", desc: "Create profiles, access levels, and commissions." },
                { title: "03. Create & Edit Appointments", desc: "Fast agenda flow and rescheduling." },
                { title: "04. Technical Cost Calculator", desc: "Weighing grams and deducting real stock." },
                { title: "05. Inventory Loading", desc: "Additions, deductions, and suppliers." },
                { title: "06. Retail vs Technical Stock", desc: "Difference between what you sell and use." },
                { title: "07. Daily Cash Closing", desc: "Cash, card reconciliation and discrepancies." },
                { title: "08. Tip Management", desc: "Tip reports per stylist." },
                { title: "09. CRM: Client Database", desc: "History, saved formulas, and notes." },
                { title: "10. WhatsApp Reminders", desc: "Configure automated messages." },
                { title: "11. Gift Cards & Wallets", desc: "Sales, redemption, and balance tracking." },
                { title: "12. Automated Payroll", desc: "Base salary calculation + commissions." },
                { title: "13. Client App", desc: "How your clients book online." },
                { title: "14. Support & Help", desc: "Contact engineering for issues." }
            ]
        },
        pricing: {
            title: "Smart Investment",
            subtitle: "Market penetration model. Prices designed to scale.",
            monthly_equiv: "/ month",
            billed_at: "billed every",
            save: "You Save",
            cycles: {
                monthly: "Monthly",
                quarterly: "Quarterly",
                biannual: "Semi-Annual",
                annual: "Annual"
            },
            plan_basic: "Agendiapp Salon",
            plan_pro: "Agendiapp Pro",
            desc_basic: "Complete daily management.",
            desc_pro: "Growth and total control.",
            features_basic: [
                "Unlimited Staff",
                "Appointment Management",
                "Client CRM",
                "Basic POS"
            ],
            features_pro: [
                "Everything in Salon Plan",
                "Inventory Control (Tech & Retail)",
                "Automated Payroll & Commissions",
                "Advanced Financial Reports",
                "Priority Support"
            ],
            cta_basic: "Choose Salon Plan",
            cta_pro: "Choose Pro Plan"
        },
        testimonials: {
            title: "Real Stories",
            subtitle: "Owners who regained control.",
            list: [
                { name: "Valeria M.", salon: "Studio 54 Hair", text: "I used to lose 20% of revenue on 'wasted product' or theft. With the gram calculator, I recovered my margin and know exactly what each stylist spends." },
                { name: "Roberto F.", salon: "Barber King Chain", text: "I have 3 locations. Seeing the cash close of all of them in real-time from my phone is priceless. AgendiApp is the financial brain of my business." },
                { name: "Jessica P.", salon: "Lashes & Brows", text: "The automatic deposit system completely eliminated clients who booked and didn't show up. I went from 15% no-shows to 0% in a month." },
                { name: "Carlos R.", salon: "Royal Barbershop", text: "Technical inventory control is the best. I know exactly how much product I use per service and when to restock. No more running out of wax or gel." },
                { name: "Sofia L.", salon: "Beauty Spa", text: "I manage 5 stylists. The automatic commission report at the end of the day saves me hours of calculation and arguments about 'who did what'." },
                { name: "Andrea D.", salon: "Colorist Expert", text: "My clients love the booking app. They say it's easier than calling, and I no longer spend my Sunday answering WhatsApps to schedule the week." }
            ]
        },
        contact: {
            title: "Questions?",
            subtitle: "Our support team speaks your language.",
            name: "Name",
            email: "Email Address",
            message: "Message",
            submit: "Send Message"
        },
        auth: {
            login_title: "Access Dashboard",
            register_title: "Create Master Account",
            email: "Email Address",
            pass: "Password",
            submit_login: "Enter",
            submit_register: "Register Business",
            google: "Continue with Google",
            apple: "Continue with Apple",
            switch_reg: "No account? Register",
            switch_log: "Already have an account? Login",
            error_generic: "An error occurred. Check your credentials."
        },
        dashboard: {
            welcome: "Welcome,",
            role_switcher: "Simular Role:",
            roles: {
                admin: "Administrator",
                staff: "Staff / Collaborator",
                client: "Client"
            },
            admin_section: {
                revenue: "Revenue (Today)",
                pin_control: "Master Security PIN",
                pin_desc: "Authorize discounts and delete appointments.",
                manage_staff: "Staff Management",
                all_calendars: "View All Calendars",
                simulate_sale: "Simulate Sale (+ $45)"
            },
            staff_section: {
                my_commissions: "My Commissions (Today)",
                my_schedule: "My Schedule",
                product_list: "Price List",
                cost_price: "Cost Price",
                retail_price: "Retail Price",
                profit: "Margin"
            },
            client_section: {
                book_now: "Book Appointment",
                loyalty: "My Points",
                promotions: "Active Promotions",
                history: "My History"
            }
        }
    }
};
