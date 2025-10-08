import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Ingredients({ session, userProfile }) {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre:'', precio:0, calorias:0, inventario:0, es_vegetariano:false, es_sano:true, tipo:'base', sabor:'' })
  const [editId, setEditId] = useState(null)
  const role = userProfile?.rol

  const fetchIngredients = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('ingredientes').select('*').order('id')
    if (error) console.error(error)
    else setIngredients(data)
    setLoading(false)
  }

  useEffect(()=>{ fetchIngredients() }, [])

  const save = async () => {
    if (!session?.user) return alert('Debe iniciar sesión para modificar')
    if (!['admin','empleado'].includes(role)) return alert('No tiene permisos')
    if (editId) {
      const { error } = await supabase.from('ingredientes').update(form).eq('id', editId)
      if (error) return alert(error.message)
      setEditId(null)
    } else {
      const { error } = await supabase.from('ingredientes').insert([form])
      if (error) return alert(error.message)
    }
    setForm({ nombre:'', precio:0, calorias:0, inventario:0, es_vegetariano:false, es_sano:true, tipo:'base', sabor:'' })
    fetchIngredients()
  }

  const edit = (ing) => {
    setEditId(ing.id)
    setForm({ ...ing })
  }

  const remove = async (id) => {
    if (!confirm('Eliminar ingrediente?')) return
    const { error } = await supabase.from('ingredientes').delete().eq('id', id)
    if (error) return alert(error.message)
    fetchIngredients()
  }

  const restock = async (id, amount=10) => {
    const ing = ingredients.find(i=>i.id===id)
    const newInv = (ing?.inventario||0) + amount
    const { error } = await supabase.from('ingredientes').update({ inventario: newInv }).eq('id', id)
    if (error) return alert(error.message)
    fetchIngredients()
  }

  const zeroIfComplement = async (id) => {
    // As requirement: "Renovar el inventario de un ingrediente (poner a 0 si es complemento)"
    const ing = ingredients.find(i=>i.id===id)
    if (!ing) return
    const newInv = ing.tipo === 'complemento' ? 0 : ing.inventario
    const { error } = await supabase.from('ingredientes').update({ inventario: newInv }).eq('id', id)
    if (error) return alert(error.message)
    fetchIngredients()
  }

  return (
    <section>
      <h2>Ingredientes</h2>
      <div className="row">
        <div className="col-md-5">
          <h5>{editId ? 'Editar' : 'Nuevo'} ingrediente</h5>
          <div className="card p-3 mb-3">
            <input className="form-control mb-2" placeholder="nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} />
            <input className="form-control mb-2" placeholder="precio" type="number" value={form.precio} onChange={e=>setForm({...form,precio:parseFloat(e.target.value)})} />
            <input className="form-control mb-2" placeholder="calorías" type="number" value={form.calorias} onChange={e=>setForm({...form,calorias:parseInt(e.target.value||0)})} />
            <input className="form-control mb-2" placeholder="inventario" type="number" value={form.inventario} onChange={e=>setForm({...form,inventario:parseInt(e.target.value||0)})} />
            <select className="form-select mb-2" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
              <option value="base">base</option>
              <option value="complemento">complemento</option>
            </select>
            <input className="form-control mb-2" placeholder="sabor (bases)" value={form.sabor||''} onChange={e=>setForm({...form,sabor:e.target.value})} />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" checked={form.es_vegetariano} onChange={e=>setForm({...form,es_vegetariano:e.target.checked})} id="veg" />
              <label className="form-check-label" htmlFor="veg">vegetariano</label>
            </div>
            <div className="form-check mb-2">
              <input className="form-check-input" type="checkbox" checked={form.es_sano} onChange={e=>setForm({...form,es_sano:e.target.checked})} id="sano" />
              <label className="form-check-label" htmlFor="sano">sano</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-success" onClick={save}>{editId ? 'Guardar' : 'Crear'}</button>
              {editId && <button className="btn btn-sm btn-secondary" onClick={()=>{ setEditId(null); setForm({ nombre:'', precio:0, calorias:0, inventario:0, es_vegetariano:false, es_sano:true, tipo:'base', sabor:'' }) }}>Cancelar</button>}
            </div>
            <div className="text-muted small mt-2">Solo administradores y empleados pueden crear/editar.</div>
          </div>
        </div>

        <div className="col-md-7">
          <h5>Lista</h5>
          {loading ? <div>Cargando...</div> : (
            <table className="table table-sm">
              <thead><tr><th>#</th><th>Nombre</th><th>Precio</th><th>Inv</th><th>Tipo</th><th>Acciones</th></tr></thead>
              <tbody>
                {ingredients.map(i=>(
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{i.nombre}</td>
                    <td>{i.precio}</td>
                    <td>{i.inventario}</td>
                    <td>{i.tipo}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={()=>edit(i)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger me-1" onClick={()=>remove(i.id)}>Eliminar</button>
                      <button className="btn btn-sm btn-outline-success me-1" onClick={()=>restock(i.id, 10)}>Reabastecer +10</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={()=>zeroIfComplement(i.id)}>Renovar (poner 0 si complemento)</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
