import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import MiPerfil from './pages/MiPerfil';
import MisCursos from './pages/MisCursos';
import MisFavoritos from './pages/MisFavoritos';
import Register from './pages/Register';
import Login from './pages/Login';
import Contact from './pages/Contact';
import About from './pages/about';
import Principal from './pages/principal';
import './styles/App.css';
// Theme variables for design touchup (fonts, colors, sizes). Safe global import.
import './styles/_theme.css';
// Frontend improvements and responsive overrides (mobile-first).
// NOTE: This import adds non-disruptive, scoped CSS only. Do NOT remove unless reverting changes described in README_FRONTEND_IMPROVEMENTS.md
import './styles/frontend.improvements.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mi-perfil" element={<MiPerfil />} />
            <Route path="/mis-cursos" element={<MisCursos />} />
            <Route path="/mis-favoritos" element={<MisFavoritos />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/principal" element={<Principal />} />
            <Route path="/perfil" element={<MiPerfil />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
