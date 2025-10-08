import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Ingredients from './components/Ingredients'
import Products from './components/Products'

export default function App() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session) setSession(data.session)
    }
    getSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setUserProfile(null)
      return
    }
    const fetchProfile = async () => {
      const email = session.user.email
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('correo', email)
        .single()
      if (error) {
        console.warn('No profile:', error.message)
        setUserProfile(null)
      } else setUserProfile(data)
    }
    fetchProfile()
  }, [session])

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUserProfile(null)
  }

  return (
    <div className="container py-4">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary rounded mb-4 shadow">
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img
              src="https://cdn-icons-png.flaticon.com/512/415/415682.png"
              alt="logo helados"
              className="me-2"
              style={{ width: '40px', height: '40px' }}
            />
            <span>Heladerías Kevin's</span>
          </a>
          <div className="ms-auto">
            {session?.user ? (
              <div className="d-flex align-items-center">
                <span className="me-2 text-white">Hola {session.user.email}</span>
                <button className="btn btn-sm btn-light" onClick={logout}>Cerrar sesión</button>
              </div>
            ) : (
              <Login />
            )}
          </div>
        </div>
      </nav>

      {/* Main layout con Bootstrap */}
      <main className="container">
        <div className="row">
          <div className="col-md-6 mb-4">
            <Products session={session} userProfile={userProfile} />
          </div>
          <div className="col-md-6 mb-4">
            <Ingredients session={session} userProfile={userProfile} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white text-center py-3 mt-4 rounded">
        © 2024 Heladerías Kevin's
      </footer>
    </div>
  )
}
