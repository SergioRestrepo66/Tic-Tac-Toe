import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, Check, Users } from 'lucide-react';
import './App.css';

const calcularGanador = (cuadros) => {
  const lineas = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (let linea of lineas) {
    const [a,b,c] = linea;
    if (cuadros[a] && cuadros[a] === cuadros[b] && cuadros[a] === cuadros[c]) {
      return { ganador: cuadros[a], linea };
    }
  }
  if (cuadros.every(c => c !== null)) return { ganador: 'empate', linea: null };
  return null;
};

const minimax = (tablero, profundidad, esMaximizador, simboloIA) => {
  const resultado = calcularGanador(tablero);
  const simboloJugador = simboloIA === 'X' ? 'O' : 'X';
  if (resultado?.ganador === simboloIA) return 10 - profundidad;
  if (resultado?.ganador === simboloJugador) return profundidad - 10;
  if (resultado?.ganador === 'empate') return 0;
  if (esMaximizador) {
    let mejor = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (tablero[i] === null) {
        tablero[i] = simboloIA;
        mejor = Math.max(mejor, minimax(tablero, profundidad + 1, false, simboloIA));
        tablero[i] = null;
      }
    }
    return mejor;
  } else {
    let mejor = Infinity;
    for (let i = 0; i < 9; i++) {
      if (tablero[i] === null) {
        tablero[i] = simboloJugador;
        mejor = Math.min(mejor, minimax(tablero, profundidad + 1, true, simboloIA));
        tablero[i] = null;
      }
    }
    return mejor;
  }
};

const mejorMovimiento = (tablero, simboloIA) => {
  let mejor = -Infinity, mov = null;
  for (let i = 0; i < 9; i++) {
    if (tablero[i] === null) {
      tablero[i] = simboloIA;
      let puntaje = minimax(tablero, 0, false, simboloIA);
      tablero[i] = null;
      if (puntaje > mejor) { mejor = puntaje; mov = i; }
    }
  }
  return mov;
};

const encontrarMovimientoGanador = (tablero, jugador) => {
  for (let i = 0; i < 9; i++) {
    if (tablero[i] === null) {
      const nuevo = [...tablero];
      nuevo[i] = jugador;
      if (calcularGanador(nuevo)?.ganador === jugador) return i;
    }
  }
  return null;
};

const movimientoIA = (tablero, dificultad, simboloIA) => {
  const simboloJugador = simboloIA === 'X' ? 'O' : 'X';
  const disponibles = tablero.map((c,i) => c === null ? i : null).filter(i => i !== null);
  const ganador = encontrarMovimientoGanador(tablero, simboloIA);
  if (ganador !== null) return ganador;
  const bloqueador = encontrarMovimientoGanador(tablero, simboloJugador);
  if (bloqueador !== null) return bloqueador;
  const probabilidades = {facil: 0.85, media: 0.5, dificil: 0.25};
  if (Math.random() < (probabilidades[dificultad] || 0.5)) {
    return disponibles[Math.floor(Math.random() * disponibles.length)];
  }
  return mejorMovimiento(tablero, simboloIA);
};

const generarCodigo = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Sistema PeerJS para conexión directa entre dispositivos
let peerInstance = null;

const initPeer = (peerId) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout al conectar con PeerJS. Verifica tu conexión a internet.'));
    }, 15000); // Aumentado a 15 segundos

    const initializePeer = () => {
      try {
        // Verificar que PeerJS esté disponible
        if (!window.Peer) {
          reject(new Error('PeerJS no se cargó correctamente'));
          return;
        }

        const peer = new window.Peer(peerId, {
          debug: 2, // Para ayudar en debugging
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
              { urls: 'turn:global.turn.twilio.com:3478?transport=udp', username: 'test', credential: 'test123' }
            ]
          }
        });

        peer.on('open', (id) => {
          console.log('Peer conectado con ID:', id);
          clearTimeout(timeout);
          resolve(peer);
        });

        peer.on('error', (err) => {
          console.error('Error de Peer:', err);
          clearTimeout(timeout);
          
          // Mensajes de error más específicos
          let mensajeError = 'Error de conexión';
          if (err.type === 'peer-unavailable') {
            mensajeError = 'Código de partida no encontrado. Verifica el código.';
          } else if (err.type === 'network') {
            mensajeError = 'Error de red. Verifica tu conexión a internet.';
          } else if (err.type === 'unavailable-id') {
            mensajeError = 'ID no disponible. Intenta con otro código.';
          }
          
          reject(new Error(mensajeError));
        });

      } catch (error) {
        clearTimeout(timeout);
        reject(new Error('Error inicializando Peer: ' + error.message));
      }
    };

    // Cargar PeerJS si no está disponible
    if (!window.Peer) {
      console.log('Cargando PeerJS...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.0/dist/peerjs.min.js';
      
      script.onload = () => {
        console.log('PeerJS cargado correctamente');
        setTimeout(initializePeer, 500); // Pequeño delay para asegurar carga
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('No se pudo cargar PeerJS. Verifica tu conexión.'));
      };
      
      document.head.appendChild(script);
    } else {
      initializePeer();
    }
  });
};

const Celda = ({ valor, onClick, esGanadora }) => (
  <button onClick={onClick} className={`celda ${esGanadora ? 'ganadora' : ''} ${valor ? 'not-allowed' : ''}`}>
    {valor && <span className={`celda-valor ${valor === 'X' ? 'x' : 'o'}`}>{valor}</span>}
  </button>
);

const Tablero = ({ tablero, onClick, lineaGanadora }) => (
  <div className="tablero">
    {tablero.map((v,i) => <Celda key={i} valor={v} onClick={() => onClick(i)} esGanadora={lineaGanadora?.includes(i)} />)}
  </div>
);

export default function TicTacToeGalactico() {
  const [modoJuego, setModoJuego] = useState(null);
  const [tablero, setTablero] = useState(Array(9).fill(null));
  const [esXTurno, setEsXTurno] = useState(true);
  const [resultado, setResultado] = useState(null);
  const [codigoSesion, setCodigoSesion] = useState('');
  const [esperandoJugador, setEsperandoJugador] = useState(false);
  const [partidaIniciada, setPartidaIniciada] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [inputCodigo, setInputCodigo] = useState('');
  const [miSimbolo, setMiSimbolo] = useState(null);
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [dificultadIA, setDificultadIA] = useState('media');
  const [simboloJugador, setSimboloJugador] = useState('X');
  const [contadorPartidas, setContadorPartidas] = useState(0);
  const [conexionEstablecida, setConexionEstablecida] = useState(false);
  
  const connectionRef = useRef(null);

  useEffect(() => {
    if (tablero.every(c => c === null) && resultado) setResultado(null);
  }, [tablero, resultado]);

  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
      if (peerInstance) {
        peerInstance.destroy();
        peerInstance = null;
      }
    };
  }, []);

  const copiarCodigo = async () => {
    try {
      // Método moderno con Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codigoSesion);
        setCodigoCopiado(true);
        setTimeout(() => setCodigoCopiado(false), 2000);
        return;
      }
      
      // Método alternativo para navegadores más antiguos o móviles
      const textArea = document.createElement('textarea');
      textArea.value = codigoSesion;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCodigoCopiado(true);
          setTimeout(() => setCodigoCopiado(false), 2000);
        } else {
          throw new Error('Falló execCommand');
        }
      } catch (err) {
        console.error('Falló copiar con execCommand:', err);
        // Último recurso: mostrar el código para que lo copien manualmente
        alert(`Código: ${codigoSesion}\n\nCopia este código manualmente y compártelo.`);
      } finally {
        document.body.removeChild(textArea);
      }
      
    } catch (error) {
      console.error('Error al copiar:', error);
      // Si todo falla, mostrar alerta con el código
      alert(`Código: ${codigoSesion}\n\nCopia este código manualmente y compártelo.`);
    }
  };

  const iniciarModoIA = (dif) => {
    setDificultadIA(dif);
    setModoJuego('ia');
    setTablero(Array(9).fill(null));
    const simb = contadorPartidas % 4 < 2 ? 'X' : 'O';
    setSimboloJugador(simb);
    setEsXTurno(true);
    setResultado(null);
    setPartidaIniciada(true);
    if (simb === 'O') {
      setTimeout(() => {
        const mov = movimientoIA(Array(9).fill(null), dif, 'X');
        if (mov !== null) {
          const nuevo = Array(9).fill(null);
          nuevo[mov] = 'X';
          setTablero(nuevo);
          setEsXTurno(false);
        }
      }, 500);
    }
  };

  const iniciarMultijugador = async () => {
    try {
      const codigo = generarCodigo();
      console.log('Creando partida con código:', codigo);
      
      setCodigoSesion(codigo);
      setModoJuego('multijugador');
      setEsperandoJugador(true);
      setMiSimbolo('X');
      setTablero(Array(9).fill(null));
      setResultado(null);
      setEsXTurno(true);
      
      const peer = await initPeer(`ttt-${codigo}`);
      console.log('Peer creado como host');
      
      const waitTimeout = setTimeout(() => {
        if (esperandoJugador) {
          alert('No se unió ningún jugador. El código expiró.');
          volverAlMenu();
        }
      }, 180000); // 3 minutos máximo esperando
      
      peer.on('connection', (conn) => {
        console.log('Jugador conectándose...');
        clearTimeout(waitTimeout);
        connectionRef.current = conn;
        
        conn.on('open', () => {
          console.log('Conexión abierta con jugador');
          setEsperandoJugador(false);
          setPartidaIniciada(true);
          setConexionEstablecida(true);
          
          // Enviar estado inicial
          conn.send({
            tipo: 'inicio',
            tablero: Array(9).fill(null),
            turno: 'X',
            simboloJugador: 'O' // El oponente será O
          });
        });
        
        conn.on('data', (data) => {
          console.log('Datos recibidos:', data);
          if (data.tipo === 'movimiento') {
            setTablero(data.tablero);
            setEsXTurno(data.turno === 'X');
            if (data.resultado) {
              setResultado(data.resultado);
            }
          } else if (data.tipo === 'reinicio') {
            setTablero(Array(9).fill(null));
            setResultado(null);
            setEsXTurno(true);
          }
        });
        
        conn.on('close', () => {
          console.log('Conexión cerrada por el oponente');
          alert('El oponente se desconectó');
          volverAlMenu();
        });

        conn.on('error', (err) => {
          console.error('Error en conexión:', err);
          alert('Error en la conexión con el oponente');
        });
      });
      
      // Manejar errores del peer después de creado
      peer.on('error', (err) => {
        console.error('Error del peer host:', err);
        alert('Error en la conexión: ' + err.message);
        volverAlMenu();
      });
      
    } catch (error) {
      console.error('Error en iniciar Multijugador:', error);
      alert('Error al crear la partida: ' + error.message);
      volverAlMenu();
    }
  };

  const unirseAPartida = async () => {
    try {
      const codigo = inputCodigo.toUpperCase().trim();
      if (codigo.length !== 6) {
        alert('El código debe tener exactamente 6 caracteres');
        return;
      }
      
      console.log('Uniéndose a partida con código:', codigo);
      
      setCodigoSesion(codigo);
      setModoJuego('multijugador');
      setMiSimbolo('O');
      setResultado(null);
      setMostrarUnirse(false);
      setEsperandoJugador(true);
      
      // Generar ID único para el guest
      const guestId = `ttt-guest-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const peer = await initPeer(guestId);
      console.log('Peer guest creado con ID:', guestId);
      
      const conn = peer.connect(`ttt-${codigo}`, {
        reliable: true,
        serialization: 'json'
      });
      
      connectionRef.current = conn;
      
      const connectionTimeout = setTimeout(() => {
        if (!conexionEstablecida) {
          console.log('Timeout de conexión alcanzado');
          conn.close();
          alert('No se pudo conectar. Verifica el código e intenta nuevamente.');
          volverAlMenu();
        }
      }, 10000); // 10 segundos máximo
      
      conn.on('open', () => {
        console.log('Conexión abierta con host');
        clearTimeout(connectionTimeout);
        setConexionEstablecida(true);
        setPartidaIniciada(true);
        setEsperandoJugador(false);
      });
      
      conn.on('data', (data) => {
        console.log('Datos recibidos del host:', data);
        if (data.tipo === 'inicio') {
          setTablero(data.tablero);
          setEsXTurno(data.turno === 'X');
          // El host asigna el símbolo O al guest
          setMiSimbolo(data.simboloJugador || 'O');
        } else if (data.tipo === 'movimiento') {
          setTablero(data.tablero);
          setEsXTurno(data.turno === 'X');
          if (data.resultado) {
            setResultado(data.resultado);
          }
        } else if (data.tipo === 'reinicio') {
          setTablero(Array(9).fill(null));
          setResultado(null);
          setEsXTurno(true);
        }
      });
      
      conn.on('close', () => {
        console.log('Conexión cerrada por el host');
        alert('El host se desconectó');
        volverAlMenu();
      });
      
      conn.on('error', (err) => {
        console.error('Error en conexión guest:', err);
        clearTimeout(connectionTimeout);
        alert('Error de conexión: ' + (err.message || 'Verifica el código e intenta nuevamente.'));
        volverAlMenu();
      });
      
    } catch (error) {
      console.error('Error en unirseAPartida:', error);
      alert('Error al unirse: ' + error.message);
      volverAlMenu();
    }
  };

  const enviarMovimiento = (nuevoTablero, nuevoTurno, nuevoResultado = null) => {
    if (connectionRef.current && connectionRef.current.open) {
      connectionRef.current.send({
        tipo: 'movimiento',
        tablero: nuevoTablero,
        turno: nuevoTurno,
        resultado: nuevoResultado
      });
    }
  };

  const manejarClick = async (indice) => {
    if (tablero[indice] || resultado) return;
    
    if (modoJuego === 'multijugador') {
      const turnoActual = esXTurno ? 'X' : 'O';
      if (turnoActual !== miSimbolo) return;
    }
    
    const nuevo = [...tablero];
    const simb = modoJuego === 'ia' ? simboloJugador : miSimbolo;
    nuevo[indice] = simb;
    setTablero(nuevo);
    
    const res = calcularGanador(nuevo);
    if (res) {
      setResultado(res);
      if (modoJuego === 'multijugador') {
        const nuevoTurno = miSimbolo === 'X' ? 'O' : 'X';
        enviarMovimiento(nuevo, nuevoTurno, res);
      }
      return;
    }
    
    if (modoJuego === 'ia') {
      setEsXTurno(!esXTurno);
      setTimeout(() => {
        const sIA = simboloJugador === 'X' ? 'O' : 'X';
        const mov = movimientoIA(nuevo, dificultadIA, sIA);
        if (mov !== null) {
          const conIA = [...nuevo];
          conIA[mov] = sIA;
          setTablero(conIA);
          const resIA = calcularGanador(conIA);
          if (resIA) setResultado(resIA);
          else setEsXTurno(simboloJugador === 'X');
        }
      }, 500);
    } else {
      setEsXTurno(!esXTurno);
      const nuevoTurno = miSimbolo === 'X' ? 'O' : 'X';
      enviarMovimiento(nuevo, nuevoTurno);
    }
  };

  const reiniciar = async () => {
    if (modoJuego === 'ia') {
      const nueva = contadorPartidas + 1;
      setContadorPartidas(nueva);
      const nuevoSimb = nueva % 4 < 2 ? 'X' : 'O';
      setSimboloJugador(nuevoSimb);
      setTablero(Array(9).fill(null));
      setResultado(null);
      setEsXTurno(true);
      if (nuevoSimb === 'O') {
        setTimeout(() => {
          const mov = movimientoIA(Array(9).fill(null), dificultadIA, 'X');
          if (mov !== null) {
            const nuevo = Array(9).fill(null);
            nuevo[mov] = 'X';
            setTablero(nuevo);
            setEsXTurno(false);
          }
        }, 500);
      }
    } else {
      setTablero(Array(9).fill(null));
      setResultado(null);
      setEsXTurno(true);
      
      if (connectionRef.current && connectionRef.current.open) {
        connectionRef.current.send({
          tipo: 'reinicio'
        });
      }
    }
  };

  const volverAlMenu = () => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (peerInstance) {
      peerInstance.destroy();
      peerInstance = null;
    }
    
    setModoJuego(null);
    setTablero(Array(9).fill(null));
    setEsXTurno(true);
    setResultado(null);
    setCodigoSesion('');
    setEsperandoJugador(false);
    setPartidaIniciada(false);
    setMostrarUnirse(false);
    setInputCodigo('');
    setContadorPartidas(0);
    setSimboloJugador('X');
    setConexionEstablecida(false);
  };

  const esTurnoDeX = modoJuego === 'ia' ? esXTurno : (miSimbolo === 'X' ? esXTurno : !esXTurno);
  const simboloIA = simboloJugador === 'X' ? 'O' : 'X';
  const partidaActual = (contadorPartidas % 4) + 1;
  const cicloInfo = contadorPartidas % 4 < 2 
    ? `Partida ${partidaActual}/2 - Tú: X, IA: O` 
    : `Partida ${partidaActual-2}/2 - Tú: O, IA: X`;

  return (
    <div className="app-container">
      <div className="app-overlay"/>
      <nav className="app-nav">
        <h1 className="app-title">
          <Sparkles size={24}/> Tic Tac Toe
        </h1>
      </nav>
      <div className="main-content">
        <div className="card">
          {!modoJuego && !mostrarUnirse && (
            <div className="text-center">
              <h2 className="menu-title">Selecciona el modo de juego</h2>
              <div className="difficulty-selection">
                <h3 className="difficulty-title">Dificultad de la IA:</h3>
                <div className="difficulty-buttons">
                  {['facil','media','dificil'].map((d) => (
                    <button 
                      key={d} 
                      onClick={() => iniciarModoIA(d)} 
                      className={`difficulty-button ${d === 'facil' ? 'easy' : d}`}
                    >
                      {d.charAt(0).toUpperCase()+d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={iniciarMultijugador} 
                className="menu-button create-game-button"
              >
                <Users size={24}/> Crear Partida Multijugador
              </button>
              <button 
                onClick={() => setMostrarUnirse(true)} 
                className="menu-button join-game-button"
              >
                Unirse a Partida
              </button>
            </div>
          )}
          
          {mostrarUnirse && !modoJuego && (
            <div className="text-center">
              <h2 className="join-screen-title">Ingresa el código</h2>
              <input 
                type="text" 
                value={inputCodigo} 
                onChange={(e) => setInputCodigo(e.target.value.trim().toUpperCase().slice(0,6))} 
                placeholder="ABC123" 
                maxLength={6} 
                className="code-input"
              />
              <button 
                onClick={unirseAPartida} 
                disabled={inputCodigo.length !== 6} 
                className="join-button"
              >
                Unirse
              </button>
              <button 
                onClick={() => {setMostrarUnirse(false); setInputCodigo('');}} 
                className="back-button"
              >
                Volver
              </button>
            </div>
          )}
          
          {modoJuego && esperandoJugador && (
            <div className="waiting-screen">
              <h3 className="waiting-title">Código de la partida:</h3>
              <div className="session-code-container">
                <div className="session-code">{codigoSesion}</div>
                <button onClick={copiarCodigo} className="copy-button" title="Copiar">
                  {codigoCopiado ? <Check size={24}/> : <Copy size={24}/>}
                </button>
              </div>
              <div className="spinner-container">
                <div className="spinner"/>
                <p className="waiting-text">Esperando jugador...</p>
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 1)',
                fontSize: '0.85rem',
                marginTop: '1rem',
                lineHeight: '1.4'
              }}>
                Comparte este código con tu amigo/a
              </p>
              <button onClick={volverAlMenu} className="cancel-button">Cancelar</button>
            </div>
          )}
          
          {modoJuego && partidaIniciada && !esperandoJugador && (
            <>
              {modoJuego === 'ia' && 
                <div className="game-info">
                  <span>{cicloInfo}</span>
                </div>
              }
              {modoJuego === 'multijugador' && conexionEstablecida && (
                <div className="game-info">
                  <span style={{color: '#22c55e'}}>● Conectado</span>
                </div>
              )}
              <div className="status-bar">
                {resultado ? (
                  <div className="status-result">
                    {resultado.ganador === 'empate' 
                      ? '¡Empate!' 
                      : `¡Jugador ${resultado.ganador} ganó!`}
                  </div>
                ) : (
                  <div className="turn-indicator">
                    Turno de: <span className={esTurnoDeX ? 'turn-x' : 'turn-o'}>
                      {modoJuego === 'ia' 
                        ? (esXTurno 
                            ? (simboloJugador === 'X' ? `TÚ (${simboloJugador})` : `IA (${simboloIA})`)
                            : (simboloJugador === 'O' ? `TÚ (${simboloJugador})` : `IA (${simboloIA})`))
                        : (esXTurno === (miSimbolo === 'X') 
                            ? `TÚ (${miSimbolo})` 
                            : `OPONENTE (${miSimbolo === 'X' ? 'O' : 'X'})`)}
                    </span>
                  </div>
                )}
              </div>
              <Tablero 
                tablero={tablero} 
                onClick={manejarClick} 
                lineaGanadora={resultado?.linea}
              />
              <div className="game-buttons">
                <button onClick={reiniciar} className="game-button restart-button">
                  Reiniciar
                </button>
                <button onClick={volverAlMenu} className="game-button menu-return-button">
                  Menú
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <footer className="app-footer">
        <p>&copy; 2025 Tic-Tac-Toe - Todos los derechos reservados - Creado By Sergio Restrepo</p>
      </footer>
    </div>
  );
}