import './globals.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '600', '800', '900'],
});

export const metadata = {
  title: 'Creativity Lab · Black Gold',
  description: 'Centro visual de Content OS para crear, revisar y archivar contenido Black Gold.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }) {
  const contract = `THESIS: Una mesa de producción viva donde agentes, piezas y estados comparten una sola escena; rechaza el generador aislado lleno de tarjetas equivalentes.
OWN-WORLD: Vestuario de élite Black Gold, cinco negros canónicos, Outfit, líneas de cancha y un único oro sólido para la acción principal.
STORY: Jorge ve el circuito, inicia una pieza, observa qué agente trabaja, revisa variantes y la envía al archivo sin perder contexto.
FIRST VIEWPORT: Navegación compacta a la izquierda, cabecera operativa arriba, flujo central de idea a archivo, cola visual dominante y agentes activos a la derecha.
FORM: Extensión del sistema Black Gold, modo Operate, clave established-blackgold-content-os.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md`;

  return (
    <html lang="es">
      <body className={outfit.variable}>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.currentScript.parentNode.insertBefore(document.createComment(${JSON.stringify(contract)}), document.currentScript.parentNode.firstChild);`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
