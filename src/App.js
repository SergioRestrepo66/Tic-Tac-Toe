import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Users } from 'lucide-react';

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

const guardarPartida = (codigo, datos) => {
  try { localStorage.setItem(`tictactoe_${codigo}`, JSON.stringify(datos)); return true; }
  catch { return false; }
};

const obtenerPartida = (codigo) => {
  try { const d = localStorage.getItem(`tictactoe_${codigo}`); return d ? JSON.parse(d) : null; }
  catch { return null; }
};

const eliminarPartida = (codigo) => {
  try { localStorage.removeItem(`tictactoe_${codigo}`); } catch {}
};

const Celda = ({ valor, onClick, esGanadora }) => (
  <button onClick={onClick} style={{
    width: '100%', aspectRatio: '1', background: esGanadora ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
    border: '2px solid #00FFFF', borderRadius: '10px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 'bold',
    cursor: valor ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
    color: valor === 'X' ? '#00FFFF' : '#FF00FF',
    textShadow: valor ? `0 0 20px ${valor === 'X' ? '#00FFFF' : '#FF00FF'}` : 'none',
  }}>
    {valor && <span style={{animation: 'aparecer 0.3s'}}>{valor}</span>}
  </button>
);

const Tablero = ({ tablero, onClick, lineaGanadora }) => (
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', maxWidth: '400px', margin: '0 auto', padding: '10px'}}>
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

  useEffect(() => {
    if (tablero.every(c => c === null) && resultado) setResultado(null);
  }, [tablero, resultado]);

  useEffect(() => {
    if (modoJuego === 'multijugador' && codigoSesion && !mostrarUnirse) {
      const sync = () => {
        try {
          const datos = obtenerPartida(codigoSesion);
          if (datos) {
            if (datos.jugadores === 2 && esperandoJugador) {
              setEsperandoJugador(false); setPartidaIniciada(true);
            }
            if (datos.tablero && JSON.stringify(datos.tablero) !== JSON.stringify(tablero)) setTablero(datos.tablero);
            const esMiTurno = datos.turno === miSimbolo;
            if (esXTurno !== esMiTurno) setEsXTurno(esMiTurno);
            if (JSON.stringify(datos.resultado) !== JSON.stringify(resultado)) setResultado(datos.resultado);
          }
        } catch {}
      };
      sync();
      const intervalo = setInterval(sync, 1000);
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

  const iniciarMultijugador = () => {
    const codigo = generarCodigo();
    setCodigoSesion(codigo);
    setModoJuego('multijugador');
    setEsperandoJugador(true);
    setMiSimbolo('X');
    setTablero(Array(9).fill(null));
    setResultado(null);
    setEsXTurno(true);
    if (!guardarPartida(codigo, {tablero: Array(9).fill(null), turno: 'X', jugadores: 1, resultado: null, creadoEn: Date.now()})) {
      alert('Error al crear la partida');
      setEsperandoJugador(false);
      setModoJuego(null);
    }
  };

  const unirseAPartida = () => {
    const codigo = inputCodigo.toUpperCase().trim();
    if (codigo.length !== 6) { alert('El código debe tener 6 caracteres'); return; }
    const datos = obtenerPartida(codigo);
    if (!datos) { alert('Código inválido'); return; }
    if (datos.jugadores >= 2) { alert('Partida llena'); return; }
    if (Date.now() - datos.creadoEn > 3600000) { alert('Partida expirada'); eliminarPartida(codigo); return; }
    setCodigoSesion(codigo);
    setModoJuego('multijugador');
    setMiSimbolo('O');
    setTablero(datos.tablero || Array(9).fill(null));
    setEsXTurno(datos.turno === 'X');
    setResultado(null);
    setPartidaIniciada(true);
    setMostrarUnirse(false);
    if (!guardarPartida(codigo, {...datos, jugadores: 2})) { alert('Error'); volverAlMenu(); }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoSesion).then(() => {
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2000);
    }).catch(() => alert('Código: ' + codigoSesion));
  };

  const manejarClick = (indice) => {
    if (tablero[indice] || resultado) return;
    if (modoJuego === 'multijugador' && !esXTurno) return;
    const nuevo = [...tablero];
    const simb = modoJuego === 'ia' ? simboloJugador : miSimbolo;
    nuevo[indice] = simb;
    setTablero(nuevo);
    const res = calcularGanador(nuevo);
    if (res) {
      setResultado(res);
      if (modoJuego === 'multijugador') {
        const datos = obtenerPartida(codigoSesion);
        if (datos) guardarPartida(codigoSesion, {...datos, tablero: nuevo, turno: miSimbolo === 'X' ? 'O' : 'X', resultado: res});
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
      setEsXTurno(false);
      const datos = obtenerPartida(codigoSesion);
      if (datos) guardarPartida(codigoSesion, {...datos, tablero: nuevo, turno: miSimbolo === 'X' ? 'O' : 'X'});
    }
  };

  const reiniciar = () => {
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
      setEsXTurno(miSimbolo === 'X');
      const datos = obtenerPartida(codigoSesion);
      if (datos) guardarPartida(codigoSesion, {...datos, tablero: Array(9).fill(null), turno: 'X', resultado: null});
    }
  };

  const volverAlMenu = () => {
    setModoJuego(null); setTablero(Array(9).fill(null)); setEsXTurno(true); setResultado(null);
    setCodigoSesion(''); setEsperandoJugador(false); setPartidaIniciada(false); setMostrarUnirse(false);
    setInputCodigo(''); setContadorPartidas(0); setSimboloJugador('X');
  };

  const esTurnoDeX = modoJuego === 'ia' ? esXTurno : (miSimbolo === 'X' ? esXTurno : !esXTurno);
  const simboloIA = simboloJugador === 'X' ? 'O' : 'X';
  const partidaActual = (contadorPartidas % 4) + 1;
  const cicloInfo = contadorPartidas % 4 < 2 ? `Partida ${partidaActual}/2 - Tú: X, IA: O` : `Partida ${partidaActual-2}/2 - Tú: O, IA: X`;

    return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      flexDirection:'column',
      backgroundImage: 'url("https://images.unsplash.com/photo-1502134249126-9f3755a50d78?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      position:'relative',
      overflow:'hidden'}}>

      <div style={{
        position:'absolute',
        width:'100%',
        height:'100%',
        background: 'rgba(10, 10, 46, 0.6)',
        opacity: 0.8}}/>

      <nav style={{
        background:'rgba(10,10,46,0.8)',
        backdropFilter:'blur(10px)',
        padding:'0.75rem 1rem',
        boxShadow:'0 2px 10px rgba(0,255,255,0.3)',
        position:'relative',
        zIndex:10,
        flexShrink:0}}>

        <h1 style={{
          margin:0,
          fontSize:'clamp(1.2rem,3vw,1.8rem)',
          fontWeight:'bold',
          color:'#00FFFF',
          textShadow:'0 0 20px #00FFFF',
          textAlign:'center',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          gap:'0.5rem'}}>
          <Sparkles size={24}/> Tic Tac Toe
        </h1>
      </nav>
      <div style={{
        flex:1,display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'1rem',
        position:'relative',
        zIndex:1,
        overflow:'auto'}}>

        <div style={{
          background:'rgba(255,255,255,0.1)',
          backdropFilter:'blur(10px)',
          borderRadius:'20px',
          border:'1px solid rgba(255,255,255,0.2)',
          boxShadow:'0 8px 32px 0 rgba(31,38,135,0.37)',
          padding:'clamp(15px,3vw,30px)',
          maxWidth:'500px',
          width:'100%',
          maxHeight:'100%',
          overflow:'auto'}}>
          {!modoJuego && !mostrarUnirse && (
            <div style={{textAlign:'center'}}>
              <h2 style={{
                color:'#FFF',
                marginBottom:'2rem',
                fontSize:'clamp(1.2rem,3vw,1.5rem)'}}>Selecciona el modo de juego</h2>
              <div style={{marginBottom:'1rem'}}>
                <h3 style={{
                  color:'#FFF',
                  marginBottom:'0.5rem',
                  fontSize:'1rem'}}>Dificultad de la IA:</h3>
                <div style={{
                  display:'flex',
                  gap:'8px',
                  marginBottom:'15px'}}>
                  {['facil','media','dificil'].map((d,i) => (
                    <button key={d} onClick={() => iniciarModoIA(d)} 
                    style={{
                      flex:1,padding:'12px',
                      background:['linear-gradient(135deg,#4CAF50 0%,#8BC34A 100%)','linear-gradient(135deg,#FF9800 0%,#FFC107 100%)','linear-gradient(135deg,#F44336 0%,#E91E63 100%)'][i],border:'none',
                      borderRadius:'8px',
                      color:'#FFF',
                      fontSize:'0.9rem',
                      fontWeight:'600',
                      cursor:'pointer'}}>
                      {d.charAt(0).toUpperCase()+d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={iniciarMultijugador} 
              style={{
                width:'100%',
                padding:'15px',
                marginBottom:'15px',
                background:'linear-gradient(135deg,#9D4EDD 0%,#FF00FF 100%)',
                border:'none',
                borderRadius:'10px',
                color:'#FFF',
                fontSize:'1.1rem',
                fontWeight:'600',
                cursor:'pointer',
                boxShadow:'0 4px 15px rgba(157,78,221,0.4)',
                transition:'all 0.3s',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'10px'}}>
                <Users size={24}/> Crear Partida Multijugador
              </button>
              <button onClick={() => setMostrarUnirse(true)} 
              style={{
                width:'100%',
                padding:'15px',
                background:'linear-gradient(135deg,#FFD60A 0%,#FFA500 100%)',
                border:'none',
                borderRadius:'10px',
                color:'#0a0a2e',
                fontSize:'1.1rem',
                fontWeight:'600',
                cursor:'pointer',
                boxShadow:'0 4px 15px rgba(255,214,10,0.4)',
                transition:'all 0.3s'}}>
                Unirse a Partida
              </button>
            </div>
          )}
          {mostrarUnirse && !modoJuego && (
            <div style={{textAlign:'center'}}>
              <h2 style={{color:'#FFF',
                marginBottom:'1.5rem',
                fontSize:'clamp(1.2rem,3vw,1.5rem)'}}>Ingresa el código</h2>
              <input type="text" value={inputCodigo} onChange={(e)=>setInputCodigo(e.target.value.trim().toUpperCase().slice(0,6))} placeholder="ABC123" maxLength={6} 
              style={{
                width:'100%',
                padding:'15px',
                marginBottom:'15px',
                fontSize:'1.5rem',
                textAlign:'center',
                letterSpacing:'8px',
                background:'rgba(255,255,255,0.1)',
                border:'2px solid #FFD60A',
                borderRadius:'10px',
                color:'#FFD60A',
                fontWeight:'bold'}}/>
              <button onClick={unirseAPartida} disabled={inputCodigo.length!==6} 
              style={{
                width:'100%',
                padding:'15px',
                marginBottom:'10px',
                background:inputCodigo.length===6?'linear-gradient(135deg,#00D9FF 0%,#00FFFF 100%)':'rgba(100,100,100,0.5)',
                border:'none',
                borderRadius:'10px',
                color:inputCodigo.length===6?'#0a0a2e':'#666',
                fontSize:'1.1rem',
                fontWeight:'600',cursor:inputCodigo.length===6?'pointer':'not-allowed'}}>Unirse</button>
              <button onClick={()=>{setMostrarUnirse(false);setInputCodigo('');}} 
              style={{
                width:'100%',
                padding:'12px',
                background:'transparent',
                border:'2px solid rgba(255,255,255,0.3)',
                borderRadius:'10px',
                color:'#FFF',
                fontSize:'1rem',
                cursor:'pointer'}}>Volver</button>
            </div>
          )}
          {modoJuego && esperandoJugador && (
            <div style={{textAlign:'center'}}>
              <h3 style={{color:'#FFF',marginBottom:'1rem'}}>Código de la partida:</h3>
              <div style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'10px',
                marginBottom:'2rem'}}>
                <div style={{
                  fontSize:'clamp(1.5rem,5vw,2rem)',
                  fontWeight:'bold',
                  color:'#FFD60A',
                  letterSpacing:'8px',
                  padding:'15px 30px',
                  background:'rgba(255,214,10,0.1)',
                  borderRadius:'10px',
                  border:'2px solid #FFD60A',
                  textShadow:'0 0 20px #FFD60A'}}>{codigoSesion}</div>
                <button onClick={copiarCodigo} 
                style={{
                  padding:'15px',
                  background:'rgba(255,255,255,0.1)',
                  border:'2px solid #00FFFF',
                  borderRadius:'10px',
                  color:'#00FFFF',
                  cursor:'pointer'}} title="Copiar">
                  {codigoCopiado?<Check size={24}/>:<Copy size={24}/>}
                </button>
              </div>
              <div style={{
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                gap:'15px'}}>
                <div style={{
                  width:'50px',
                  height:'50px',
                  border:'5px solid rgba(0,255,255,0.3)',
                  borderTop:'5px solid #00FFFF',
                  borderRadius:'50%',
                  animation:'girar 1s linear infinite'}}/>
                <p style={{
                  color:'#FFF',
                  fontSize:'1.1rem',
                  margin:0}}>Esperando jugador...</p>
              </div>
              <button onClick={volverAlMenu} 
              style={{
                marginTop:'2rem',
                padding:'12px 24px',
                background:'transparent',
                border:'2px solid rgba(255,255,255,0.3)',
                borderRadius:'10px',
                color:'#FFF',
                cursor:'pointer'}}>Cancelar</button>
            </div>
          )}
          {modoJuego && partidaIniciada && (
            <>
              {modoJuego==='ia' && <div 
              style={{
                textAlign:'center',
                marginBottom:'0.5rem',
                padding:'8px',
                background:'rgba(0,255,255,0.1)',
                borderRadius:'8px',
                border:'1px solid rgba(0,255,255,0.3)'}}>
                <span 
                style={{
                  color:'#00FFFF',
                  fontSize:'clamp(0.75rem,1.8vw,0.9rem)',
                  fontWeight:'600'}}>{cicloInfo}</span>
              </div>}
              <div style={{
                textAlign:'center',
                marginBottom:'0.75rem',
                color:'#FFF',
                fontSize:'clamp(0.9rem,2vw,1.1rem)'}}>
                {resultado ? (
                  <div style={{
                    padding:'15px',
                    background:'rgba(255,215,0,0.2)',
                    borderRadius:'10px',
                    border:'2px solid #FFD700'}}>
                    {resultado.ganador==='empate'?'¡Empate!':`¡Jugador ${resultado.ganador} ganó!`}
                  </div>
                ) : (
                  <div>Turno de: <span style={{color:esTurnoDeX?'#00FFFF':'#FF00FF',fontWeight:'bold',textShadow:`0 0 15px ${esTurnoDeX?'#00FFFF':'#FF00FF'}`}}>
                    {modoJuego==='ia'?(esXTurno?(simboloJugador==='X'?`TÚ (${simboloJugador})`:`IA (${simboloIA})`):(simboloJugador==='O'?`TÚ (${simboloJugador})`:`IA (${simboloIA})`)):(esXTurno?`TÚ (${miSimbolo})`:`OPONENTE (${miSimbolo==='X'?'O':'X'})`)}
                  </span></div>
                )}
              </div>
              <Tablero tablero={tablero} onClick={manejarClick} lineaGanadora={resultado?.linea}/>
              <div style={{
                display:'flex',
                gap:'10px',
                marginTop:'1rem'}}>
                <button onClick={reiniciar} 
                style={{
                  flex:1,
                  padding:'12px',
                  background:'linear-gradient(135deg,#00D9FF 0%,#00FFFF 100%)',
                  border:'none',
                  borderRadius:'10px',
                  color:'#0a0a2e',
                  fontSize:'1rem',
                  fontWeight:'600',
                  cursor:'pointer'}}>Reiniciar</button>
                <button onClick={volverAlMenu} 
                style={{
                  flex:1,padding:'12px',
                  background:'transparent',
                  border:'2px solid rgba(255,255,255,0.3)',
                  borderRadius:'10px',
                  color:'#FFF',
                  fontSize:'1rem',
                  cursor:'pointer'}}>Menú</button>
              </div>
            </>
          )}
        </div>
      </div>
      <footer style={{
        background:'rgba(10,10,46,0.8)',
        backdropFilter:'blur(10px)',
        padding:'0.75rem',
        boxShadow:'0 -2px 10px rgba(0,255,255,0.3)',
        textAlign:'center',
        color:'#FFF',
        fontSize:'clamp(0.7rem,1.5vw,0.9rem)',
        position:'relative',
        zIndex:10,flexShrink:0}}>
        <p>&copy; 2025 Tic-Tac-Toe - Todos los derechos reservados - Creado By Sergio Restrepo</p>
      </footer>
      <style>{`@keyframes girar{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes aparecer{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}button:active{transform:scale(0.98)!important}input:focus{outline:none;border-color:#00FFFF;box-shadow:0 0 20px rgba(0,255,255,0.5)}`}</style>
    </div>
  );
}