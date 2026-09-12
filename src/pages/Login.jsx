import { tenant } from '../config/tenant.js';

function Login() {
  return (
    <section id="login" className="section">
      <div className="login-card">
        <p className="eyebrow">Tenant access</p>
        <h3>{tenant.businessName}</h3>
        <p>This section is reserved for future authentication and dashboard access flows.</p>
      </div>
    </section>
  );
}

export default Login;
