import BrandMark from '@/components/BrandMark';

export const metadata = {
  title: 'Acceso · Black Gold Creativity Lab',
};

const ERRORS = {
  config: 'La sesión todavía no está configurada en el servidor.',
  credentials: 'El usuario o la contraseña no son correctos.',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = ERRORS[params?.error];

  return (
    <main className="login-shell">
      <section className="login-story" aria-labelledby="login-title">
        <div className="login-emblem" aria-hidden="true">
          <BrandMark label="" />
        </div>
        <span className="login-kicker">BLACK GOLD · SYSTEM OS</span>
        <h1 id="login-title">Creativity<br /><strong>Lab</strong></h1>
        <p>Tu circuito visual para convertir ideas en piezas listas para revisar, aprobar y archivar.</p>
        <div className="login-flow" aria-label="Flujo de trabajo">
          <span>Idea</span><i /><span>Imagen</span><i /><span>Revisión</span><i /><span>Archivo</span>
        </div>
      </section>

      <section className="login-access" aria-labelledby="access-title">
        <form action="/api/auth/login" method="post" className="login-card">
          <header>
            <span className="eyebrow">ACCESO PRIVADO</span>
            <h2 id="access-title">Entrar al laboratorio</h2>
            <p>Usa las credenciales de System OS.</p>
          </header>

          {error ? <p className="login-error" role="alert">{error}</p> : null}

          <label className="field">
            <span>Usuario</span>
            <input name="user" autoComplete="username" required autoFocus />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="button-primary full">Entrar</button>
          <small>Sesión privada de 12 horas · La contraseña no se guarda en el navegador.</small>
        </form>
      </section>
    </main>
  );
}
