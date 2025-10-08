import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [msg, setMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
    } else {
      // register: create auth user then insert profile into users table
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setMsg(error.message); return }
      // after signUp, create users row manually (you might want to implement server-side safe flow)
      const { error: err2 } = await supabase.from('users').insert([{ nombre: email, correo: email, password: password, rol: 'cliente' }])
      if (err2) setMsg(err2.message)
      else setMsg('Cuenta creada. Revisa tu email si Supabase pide confirmación.')
    }
  }

  const magicLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMsg(error.message)
    else setMsg('Revisa tu correo para el enlace mágico.')
  }

  return (
    <div className="d-flex align-items-center">
      <form className="d-flex gap-2" onSubmit={handleAuth}>
        <input className="form-control form-control-sm" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="form-control form-control-sm" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-sm btn-primary" type="submit">{mode === 'login' ? 'Entrar' : 'Registrar'}</button>
      </form>
      <div className="ms-2">
        <button className="btn btn-sm btn-link" onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}</button>
        <button className="btn btn-sm btn-link" onClick={magicLink}>Magic link</button>
        <div className="text-danger small">{msg}</div>
      </div>
    </div>
  )
}
