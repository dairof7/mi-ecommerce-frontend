import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaWhatsapp, FaCreditCard, FaTruck, FaQuestionCircle, FaFileInvoiceDollar, FaUniversity, FaMobileAlt, FaMapMarkerAlt } from 'react-icons/fa';
// import { FaMoneyBillWave } from 'react-icons/fa'; // Descomenta si necesitas este icono

// Datos de ejemplo para medios de pago (deberías obtenerlos de una config o API si cambian mucho)
// Asegúrate de que las rutas a las imágenes QR sean correctas desde tu carpeta `public`
const paymentMethodsData = [
    {
      name: "Bancolombia",
      icon: FaUniversity,
      qrImage: "/assets/images/qrs/qr-bancolombia.png", // Ruta desde la carpeta public
      details: [
        "Cuenta Ahorros: <strong>838-319676-95</strong>",
        "A nombre de: <strong>Dairo Facundo</strong>",
        // "NIT/CC: <strong>123.456.789-0</strong>"
      ],
      instructions: "Escanea el QR o usa los datos de la cuenta."
    },
    {
      name: "Nequi",
      icon: FaMobileAlt,
      qrImage: "/assets/images/qrs/qr-nequi.png",
      details: [
        "Número Celular: <strong>3013367420</strong>"
      ],
      instructions: "Envía a este número Nequi."
    },
    {
      name: "Llaves Bre-B (Nequi - Bancolombia)",
      icon: FaUniversity,
      qrImage: null,
      details: [
        "Celular: <strong>3013367420</strong>",
        "Email: <strong>dairof7@gmail.com</strong>"
      ],
      instructions: "Usa cualquiera de estas llaves para tu transferencia."
    },
    {
      name: "Tarjetas de Crédito",
      icon: FaCreditCard,
      qrImage: null,
      details: [
        "Aceptamos Visa y Mastercard.",
        "Disponible únicamente en nuestra <strong>ubicación física</strong>."
      ],
      instructions: "Este método tiene un costo adicional del 3.8%*"
    },

    // Ejemplo de Pago Contra Entrega (si aplica)
    // {
    //   name: "Pago Contra Entrega (Efectivo)",
    //   icon: FaMoneyBillWave,
    //   qrImage: null,
    //   details: ["Solo efectivo.", "Disponible en [Tu Ciudad/Región]."],
    //   instructions: "Coordina por WhatsApp para esta opción."
    // }
];

// Configuración de WhatsApp (idealmente desde variables de entorno o un archivo de configuración)
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "TU_NUMERO_DE_WHATSAPP_CON_CODIGO_PAIS"; // Ej: "573001234567"
const WHATSAPP_MESSAGE_HOWTOBUY = "Hola, tengo una pregunta sobre el proceso de compra en Solid Store.";

// Componente de Sección Reutilizable
const Section = ({ title, icon, children, id }) => (
    <div id={id} className="mb-10 p-6 bg-white rounded-lg shadow-xl border border-gray-200 scroll-mt-20"> {/* scroll-mt-20 para offset con navbar sticky */}
      <h2 className="text-xl sm:text-2xl font-semibold text-color-primary mb-4 flex items-center">
        {React.createElement(icon, { className: "text-3xl text-color-accent1 mr-3 flex-shrink-0" })}
        {title}
      </h2>
      <div className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
);

function HowToBuyPage() {
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll al inicio de la página al montar
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-color-primary mb-4">
          ¿Cómo Comprar en Solid Store?
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          ¡Comprar con nosotros es fácil y seguro! Sigue estos sencillos pasos para obtener tus productos.
          Si tienes alguna duda durante el proceso, no dudes en <a href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent("Hola, necesito ayuda con el proceso de compra.")}`} target="_blank" rel="noopener noreferrer" className="text-color-accent2 hover:underline font-medium">contactarnos por WhatsApp</a>.
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        <Section title="Paso 1: Explora y Añade al Carrito" icon={FaShoppingCart} id="paso1">
          <p>Navega por nuestras <Link to="/" className="text-color-accent2 hover:underline font-medium">categorías de productos</Link> </p>
          <p>Cuando encuentres un producto que te guste:</p>
          <ul className="list-disc list-inside ml-4 my-3 space-y-1">
            <li>Revisa sus detalles, imágenes y precio.</li>
            <li>Si aplica, selecciona la cantidad que deseas.</li>
            <li>Haz clic en el botón "Añadir al Carrito".</li>
          </ul>
          <p>Puedes seguir añadiendo más productos o, cuando estés listo, dirigirte a tu carrito para revisar tu selección.</p>
        </Section>

        <Section title="Paso 2: Revisa tu Carrito y Genera tu Cotización" icon={FaFileInvoiceDollar} id="paso2">
          <p>Una vez que hayas añadido todos los productos que deseas:</p>
          <ol className="list-decimal list-inside ml-4 my-3 space-y-1">
            <li>Ve a tu <Link to="/cart" className="text-color-accent2 hover:underline font-medium">Carrito de Compras</Link> (el icono <FaShoppingCart className="inline mb-1"/> en la parte superior derecha).</li>
            <li>Verifica cuidadosamente los productos y las cantidades. Puedes ajustar las cantidades o eliminar productos si es necesario desde esta página.</li>
            <li>Cuando todo esté correcto, haz clic en el botón "Generar Cotización".</li>
          </ol>
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-md">
            <p className="font-semibold flex items-center"><FaTruck className="mr-2"/> Importante sobre el Envío:</p>
            <p className="text-sm">Los precios mostrados en los productos y en el subtotal del carrito <strong>no incluyen el costo de envío</strong>. Este costo es variable y se determinará según tu ubicación y las características de tu pedido (peso/volumen). Te informaremos el costo exacto del envío durante la confirmación por WhatsApp.</p>
          </div>
        </Section>

        <Section title="Paso 3: Confirmación y Coordinación por WhatsApp" icon={FaWhatsapp} id="paso3">
          <p>Después de generar tu cotización, serás redirigido a tu historial de cotizaciones (o puedes acceder desde el menú de tu perfil). La cotización más reciente estará identificada y usualmente en estado "Pendiente".</p>
          <p>Para continuar y finalizar tu compra, el siguiente paso es crucial:</p>
          <ul className="list-disc list-inside ml-4 my-3 space-y-1">
            <li>Busca la opción o botón <strong className="text-green-600">"Contactar por WhatsApp"</strong> que aparecerá junto a tu cotización pendiente en tu historial.</li>
            <li>Al hacer clic, se abrirá una conversación con nosotros en WhatsApp. El mensaje inicial incluirá la referencia de tu cotización para agilizar el proceso.</li>
            <li>A través de WhatsApp, uno de nuestros asesores:
                <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Confirmará la disponibilidad final de los productos.</li>
                    <li>Calculará y te informará el costo exacto del envío a tu dirección.</li>
                    <li>Resolverá cualquier duda adicional que tengas.</li>
                    <li>Te indicará el monto total final a pagar (productos + envío).</li>
                </ul>
            </li>
          </ul>
        </Section>

        <Section title="Paso 4: Realiza el Pago" icon={FaCreditCard} id="paso4">
          <p>Una vez que hayamos confirmado todos los detalles y el total a pagar por WhatsApp, podrás realizar el pago utilizando uno de nuestros medios autorizados. Aquí te presentamos las opciones:</p>
          
          <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-6 not-prose">
              {paymentMethodsData.map((method) => (
                <div key={method.name} className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 flex flex-col items-center text-center">
                  {method.icon && React.createElement(method.icon, { className: "text-3xl text-color-accent2 mb-2" })}
                  <h4 className="text-lg font-medium text-color-secondary mb-2">{method.name}</h4>
                  {method.qrImage && (
                    <img 
                        src={method.qrImage} 
                        alt={`QR ${method.name}`} 
                        className="w-32 h-32 object-contain mb-2 border p-1 bg-white shadow-sm" 
                    />
                  )}
                  {method.details && method.details.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-0.5 mb-1">
                      {method.details.map((detail, index) => (
                        <p key={index} dangerouslySetInnerHTML={{ __html: detail }} />
                      ))}
                    </div>
                  )}
                  {method.instructions && <p className="text-xs text-gray-500 italic mt-1">{method.instructions}</p>}
                </div>
              ))}
          </div>
          <p className="mt-4 font-semibold text-gray-800">Una vez realizado el pago, por favor **envía el comprobante a nuestro chat de WhatsApp**. Esto es esencial para que podamos verificar tu pago y proceder con el despacho de tu pedido lo antes posible.</p>
        </Section>

        <Section title="Paso 5: Envío y Entrega de tu Pedido" icon={FaTruck} id="paso5">
          <p>Después de que confirmemos la recepción de tu pago a través del comprobante enviado por WhatsApp:</p>
          <ul className="list-disc list-inside ml-4 my-3 space-y-1">
            <li>Prepararemos tu pedido para el envío con el mayor cuidado.</li>
            <li>Te mantendremos informado sobre el estado del despacho.</li>
            <li>Si aplica, te proporcionaremos información sobre la empresa transportadora y el número de guía para que puedas hacer seguimiento a tu paquete.</li>
            <li>Los tiempos de entrega pueden variar según tu ubicación y la logística de la transportadora.</li>
          </ul>
          <p>¡Pronto tendrás tus productos contigo!</p>
        </Section>

        <Section title="¿Tienes Más Preguntas?" icon={FaQuestionCircle} id="preguntas">
          <p>Nuestro equipo está listo para ayudarte. Si tienes alguna pregunta en cualquier momento del proceso o necesitas asistencia adicional, no dudes en contactarnos.</p>
          <div className="mt-4 text-center sm:text-left">
            <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE_HOWTOBUY)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-base shadow-md"
            >
                <FaWhatsapp className="mr-2" /> Preguntar por WhatsApp
            </a>
          </div>
        </Section>

        {/* --- Sección de Ubicación --- */}
        <div id="ubicacion" className="mt-10 p-6 bg-white rounded-lg shadow-xl border border-gray-200 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-color-primary mb-4 flex items-center">
            <FaMapMarkerAlt className="text-3xl text-color-accent1 mr-3 flex-shrink-0" />
            O Recoge en Tienda
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Si prefieres, también puedes realizar tu compra y recogerla directamente en nuestro local físico. ¡Te esperamos para asesorarte personalmente!
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
      </div>
    </div>
  );
}

export default HowToBuyPage;