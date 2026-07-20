import {
  useEffect,
  useState
} from 'react';

export default function Login() {
  const [loginFailed, setLoginFailed] = useState(false);

  async function login(event) {
    event.preventDefault();
    setLoginFailed(false);
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch( 'http://localhost:8080/login',
      {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: username,
            password: password
        })
      }
    );

    if(!response.ok){
      setLoginFailed(true);
      return;
    }

    const data = await response.json();

    if (data.success) {
      window.location.href = '/home';
    }
  }

  return (
    <div>
        <h1>Login</h1>
        <form onSubmit={login}>
            <input id="username" placeholder="Username" />
            <input id="password" type="password" placeholder="Password"/>
            <button> Login </button>

            {
              loginFailed ? (
                <div className="incorrect-prompt">
                  <p>Incorrect username and/or password.</p>
                </div>
              ) : null
            }
      </form>
      <br />

      <a href="/signup">   Signup </a>
    </div>
  );
}
