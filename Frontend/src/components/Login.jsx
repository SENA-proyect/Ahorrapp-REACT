import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import"../styles/login.css";


const VERTEX_SHADER_SOURCE = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  void main() {
    float mr = min(iResolution.x, iResolution.y);
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / mr;

    float d = -iTime * 0.5;
    float a = 0.0;
    for (float i = 0.0; i < 8.0; ++i) {
      a += cos(i - d - a * uv.x);
      d += sin(uv.y * i + a);
    }
    d += iTime * 0.5;

    vec3 base_dark     = vec3(0.05, 0.08, 0.05);
    vec3 mid_green     = vec3(0.1,  0.35, 0.1);
    vec3 metallic_spec = vec3(0.6,  0.7,  0.5);

    float pattern_factor = dot(uv, vec2(cos(d), sin(a))) * 0.5 + 0.5;
    pattern_factor *= cos(d * 0.5 + a * 0.3) * 0.5 + 0.5;

    float shininess = pow(clamp(pattern_factor, 0.0, 1.0), 10.0 + sin(iTime * 0.5) * 5.0);

    vec3 final_color = mix(base_dark, mid_green, pattern_factor);
    final_color += metallic_spec * shininess * 0.7;
    final_color = pow(final_color, vec3(1.5));

    gl_FragColor = vec4(final_color, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function Login() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      console.error("WebGL no es soportado por este navegador.");
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    const program = createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    const resolutionLocation = gl.getUniformLocation(program, "iResolution");
    const timeLocation = gl.getUniformLocation(program, "iTime");
    const positionLocation = gl.getAttribLocation(program, "a_position");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const startTime = performance.now();

    function draw() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (performance.now() - startTime) / 1000.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener("resize", draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", draw);
    };
  }, []);

  // Conexion con el backend, verificacion de email y password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { email, password } = e.target.elements;

    if (!email.value || !password.value) {
      setError("Por favor completa todos los campos");
      return;
    }

    setCargando(true);

    const respuesta = await loginUser({
      correo: email.value,
      contraseña: password.value,
    });

    setCargando(false);

    if (respuesta.ok) {
      // Guardamos el token y los datos del usuario en localStorage
      localStorage.setItem("token", respuesta.token);
      localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));
      navigate("/Dashboard");
    } else {
      setError(respuesta.mensaje);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} id="shaderCanvas" />

      <div className="login-container">
        <form onSubmit={handleSubmit} className="form-container">
          <h1>Iniciar Sesión</h1>

          <div className="form-group">
            <input type="text" id="email" placeholder="Correo Electrónico" />
          </div>

          <div className="form-group">
            <input type="password" id="password" placeholder="Contraseña" />
          </div>

            <button type="submit" className="boton" style={{ borderRadius: "25px" }}>
              Entrar
            </button>

          <a href="#" className="text-white">
            ¿Olvidaste tu contraseña?
          </a>

          <Link to="/Registrar" className="text-white">
            Crear una cuenta
          </Link>
        </form>
      </div>
    </>
  );
}