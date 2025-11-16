import React, { useState, useEffect } from 'react';
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

// Sistema de almacenamiento en memoria para partidas multijugador
const partidasEnMemoria = {};

const guardarPartida = (codigo, datos) => {
  try {
    console.log('Guardando partida:', codigo, datos);
    partidasEnMemoria[codigo] = datos;
    console.log('Partida guardada exitosamente');
    return true;
  } catch (error) {
    console.error('Error guardando partida:', error);
    return false;
  }
};

const obtenerPartida = (codigo) => {
  try {
    console.log('Obteniendo partida:', codigo);
    const partida = partidasEnMemoria[codigo] || null;
    console.log('Partida obtenida:', partida);
    return partida;
  } catch (error) {
    console.error('Error obteniendo partida:', error);
    return null;
  }
};

const eliminarPartida = (codigo) => {
  try {
    delete partidasEnMemoria[codigo];
    console.log('Partida eliminada:', codigo);
  } catch (error) {
    console.error('Error eliminando partida:', error);
  }
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
  const [modoAlmacenamiento, setModoAlmacenamiento] = useState('desconocido');

  useEffect(() => {
    // Detectar si window.storage está disponible
    const detectarAlmacenamiento = async () => {
      try {
        if (typeof window !== 'undefined' && window.storage) {
          setModoAlmacenamiento('cloud');
        } else {
          setModoAlmacenamiento('local');
        }
      } catch {
        setModoAlmacenamiento('local');
      }
    };
    detectarAlmacenamiento();
  }, []);

  useEffect(() => {
    if (tablero.every(c => c === null) && resultado) setResultado(null);
  }, [tablero, resultado]);

  useEffect(() => {
    if (modoJuego === 'multijugador' && codigoSesion && !mostrarUnirse) {
      const sync = async () => {
        try {
          const datos = await obtenerPartida(codigoSesion);
          if (datos) {
            if (datos.jugadores === 2 && esperandoJugador) {
              setEsperandoJugador(false);
              setPartidaIniciada(true);
            }
            if (datos.tablero && JSON.stringify(datos.tablero) !== JSON.stringify(tablero)) {
              setTablero(datos.tablero);
            }
            const esMiTurno = datos.turno === miSimbolo;
            if (esXTurno !== esMiTurno) setEsXTurno(esMiTurno);
            if (JSON.stringify(datos.resultado) !== JSON.stringify(resultado)) {
              setResultado(datos.resultado);
            }
          }
        } catch (error) {
          console.error('Error sincronizando:', error);
        }
      };
      sync();
      const intervalo = setInterval(sync, 1500);
      return () => clearInterval(intervalo);
    }
  }, [modoJuego, codigoSesion, esperandoJugador, miSimbolo, mostrarUnirse, tablero, esXTurno, resultado]);

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
      setCodigoSesion(codigo);
      setModoJuego('multijugador');
      setEsperandoJugador(true);
      setMiSimbolo('X');
      setTablero(Array(9).fill(null));
      setResultado(null);
      setEsXTurno(true);
      
      const guardado = await guardarPartida(codigo, {
        tablero: Array(9).fill(null),
        turno: 'X',
        jugadores: 1,
        resultado: null,
        creadoEn: Date.now()
      });
      
      if (!guardado) {
        alert('Error al crear la partida. Por favor intenta nuevamente.');
        setEsperandoJugador(false);
        setModoJuego(null);
        setCodigoSesion('');
      }
    } catch (error) {
      console.error('Error en iniciarMultijugador:', error);
      alert('Error al crear la partida. Por favor intenta nuevamente.');
      setEsperandoJugador(false);
      setModoJuego(null);
      setCodigoSesion('');
    }
  };

  const unirseAPartida = async () => {
    try {
      const codigo = inputCodigo.toUpperCase().trim();
      if (codigo.length !== 6) {
        alert('El código debe tener 6 caracteres');
        return;
      }
      
      const datos = await obtenerPartida(codigo);
      if (!datos) {
        alert('Código inválido o partida no encontrada');
        return;
      }
      if (datos.jugadores >= 2) {
        alert('Esta partida ya está llena');
        return;
      }
      if (Date.now() - datos.creadoEn > 3600000) {
        alert('Esta partida ha expirado');
        await eliminarPartida(codigo);
        return;
      }
      
      setCodigoSesion(codigo);
      setModoJuego('multijugador');
      setMiSimbolo('O');
      setTablero(datos.tablero || Array(9).fill(null));
      setEsXTurno(datos.turno === 'O');
      setResultado(null);
      setPartidaIniciada(true);
      setMostrarUnirse(false);
      
      const guardado = await guardarPartida(codigo, {...datos, jugadores: 2});
      if (!guardado) {
        alert('Error al unirse a la partida. Intenta nuevamente.');
        volverAlMenu();
      }
    } catch (error) {
      console.error('Error en unirseAPartida:', error);
      alert('Error al unirse. Verifica el código e intenta nuevamente.');
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoSesion).then(() => {
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2000);
    }).catch(() => alert('Código: ' + codigoSesion));
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
        const datos = await obtenerPartida(codigoSesion);
        if (datos) {
          await guardarPartida(codigoSesion, {
            ...datos,
            tablero: nuevo,
            turno: miSimbolo === 'X' ? 'O' : 'X',
            resultado: res
          });
        }
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
      const datos = await obtenerPartida(codigoSesion);
      if (datos) {
        await guardarPartida(codigoSesion, {
          ...datos,
          tablero: nuevo,
          turno: miSimbolo === 'X' ? 'O' : 'X'
        });
      }
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
      const datos = await obtenerPartida(codigoSesion);
      if (datos) {
        await guardarPartida(codigoSesion, {
          ...datos,
          tablero: Array(9).fill(null),
          turno: 'X',
          resultado: null
        });
      }
    }
  };

  const volverAlMenu = () => {
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
              <button onClick={iniciarMultijugador} className="menu-button create-game-button">
                <Users size={24}/> Crear Partida Multijugador
              </button>
              <button onClick={() => setMostrarUnirse(true)} className="menu-button join-game-button">
                Unirse a Partida
              </button>
              {modoAlmacenamiento === 'local' && (
                <p style={{
                  color: 'rgba(255, 255, 255, 1)',
                  fontSize: '1.1rem',
                  marginTop: '1rem',
                  lineHeight: '1.4',
                  background: 'rgba(7, 28, 41, 0.4)',
                  padding: '10px',
                  borderRadius: '8px'
                }}>
                  Tic-Tac-Toe 2025
                </p>
              )}
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
              {modoAlmacenamiento === 'local' && (
                <p style={{
                  color: 'rgba(255, 255, 255, 1)',
                  fontSize: '0.85rem',
                  marginTop: '1rem',
                  lineHeight: '1.4'
                }}>
                  Para Unirte solo copia el codigo y pégalo en el dispositivo de tu amigo/a
                </p>
              )}
              <button onClick={volverAlMenu} className="cancel-button">Cancelar</button>
            </div>
          )}
          
          {modoJuego && partidaIniciada && (
            <>
              {modoJuego === 'ia' && 
                <div className="game-info">
                  <span>{cicloInfo}</span>
                </div>
              }
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