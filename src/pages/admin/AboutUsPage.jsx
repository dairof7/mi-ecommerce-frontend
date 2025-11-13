import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShieldAlt, FaLightbulb, FaHeart, FaStore, FaWhatsapp, FaMapMarkerAlt, FaWrench, FaMobileAlt, FaLaptop, FaVideo } from 'react-icons/fa';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;
const WHATSAPP_MESSAGE = "Hola, vengo de la página 'Quiénes Somos' y me gustaría obtener más información.";

const ValueCard = ({ icon, title, children }) => (
    <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-color-accent1 text-white mx-auto mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold text-color-primary mb-2">{title}</h3>
        <p className="text-gray-600">{children}</p>
    </div>
);

const ServiceItem = ({ icon, text }) => (
    <li className="flex items-center">
        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-green-100 text-green-600">
            {icon}
        </div>
        <span className="ml-3 text-gray-700">{text}</span>
    </li>
);

function AboutUsPage() {
    return (
        <div className="bg-gray-50">
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
                {/* --- Sección de Encabezado --- */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-color-primary sm:text-5xl lg:text-6xl tracking-tight">
                        Quiénes Somos
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                        Conectando tecnología y personas por más de 8 años.
                    </p>
                </div>

                {/* --- Sección de Historia y Servicios --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 rounded-lg shadow-lg">
                    <div>
                        <h2 className="text-3xl font-bold text-color-secondary mb-4">Nuestra Trayectoria</h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-6">
                            Nacimos hace más de 8 años como un emprendimiento apasionado por la tecnología, creciendo y construyendo una comunidad sólida a través de las redes sociales. Hoy, damos un paso gigante con nuestra propia página web y un local físico para estar aún más cerca de ti.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Nuestra evolución no se detiene. Además de ofrecerte los mejores artículos tecnológicos, ahora expandimos nuestra experiencia para brindarte soluciones integrales.
                        </p>
                    </div>
                    <div className="bg-gray-100 p-6 rounded-lg">
                        <h3 className="text-2xl font-bold text-color-secondary mb-4">Nuestros Servicios</h3>
                        <ul className="space-y-4">
                            <ServiceItem icon={<FaVideo size={20} />} text="Instalación de cámaras de seguridad y vigilancia" />
                            <ServiceItem icon={<FaLaptop size={20} />} text="Mantenimiento de software para PCs y consolas" />
                            <ServiceItem icon={<FaMobileAlt size={20} />} text="Soporte y mantenimiento para celulares" />
                        </ul>
                    </div>
                </div>

                {/* --- Sección de Valores --- */}
                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-bold text-color-secondary mb-10">Lo que nos Mueve</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ValueCard icon={<FaStar size={28} />} title="Calidad">
                            Seleccionamos cada producto y diseñamos cada servicio para superar tus expectativas.
                        </ValueCard>
                        <ValueCard icon={<FaShieldAlt size={28} />} title="Honestidad">
                            Creemos en la transparencia total. Relaciones de confianza que perduran.
                        </ValueCard>
                        <ValueCard icon={<FaLightbulb size={28} />} title="Innovación">
                            Estamos siempre en la búsqueda de lo último en tecnología para ofrecértelo primero.
                        </ValueCard>
                        <ValueCard icon={<FaHeart size={28} />} title="Servicio al Cliente">
                            Tú eres el centro de todo lo que hacemos. Tu satisfacción es nuestra misión.
                        </ValueCard>
                    </div>
                </div>

                {/* --- Sección de Ubicación --- */}
                <div className="mt-20 bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold text-color-secondary mb-4">Visítanos</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Te esperamos en nuestro local físico para asesorarte personalmente.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start text-gray-700 mb-4">
                                <FaMapMarkerAlt className="text-color-accent1 mr-3 flex-shrink-0" size={24} />
                                <span className="font-semibold text-lg">Calle 8 # 11-13, Santander de Quilichao, Cauca</span>
                            </div>
                            <p className="text-gray-500">Encuéntranos en el corazón de la ciudad, listos para ofrecerte la mejor tecnología y servicio.</p>
                        </div>
                        <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-md border">
                            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.3143225864405!2d-76.48560862463565!3d3.0098865969660897!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e307fd0c8f2b1e5%3A0xe920b68ba98d8e1d!2sSolidstore!5e0!3m2!1ses-419!2sco!4v1763051167464!5m2!1ses-419!2sco" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación de Solid Store en Google Maps"></iframe>
                        </div>
                    </div>
                </div>

                {/* --- Sección de Llamada a la Acción (CTA) --- */}
                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-bold text-color-secondary mb-6">¿Listo para empezar?</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/" className="w-full sm:w-auto flex items-center justify-center rounded-md border border-transparent bg-color-secondary px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-color-accent1 focus:outline-none focus:ring-2 focus:ring-color-accent1 focus:ring-offset-2 transition-colors">
                            <FaStore className="mr-2" /> Ir a la Tienda
                        </Link>
                        <a 
                            href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto flex items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-medium text-color-primary shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-color-secondary focus:ring-offset-2 transition-colors"
                        >
                            <FaWhatsapp className="mr-2" /> Contáctanos
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;