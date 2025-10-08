import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Products({ session, userProfile }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostRentable, setMostRentable] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    // Intentar traer productos con RPC, si no existe usar fallback
    const { data, error } = await supabase.rpc("get_products_with_ingredients");
    if (error || !data) {
      const p = await supabase.from("productos").select("*").order("id");
      setProducts(p.data || []);
    } else setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchMostRentable();
  }, []);

  const fetchMostRentable = async () => {
    // Mostrar producto más rentable SOLO a admin
    if (userProfile?.rol !== "admin") return;
    const { data, error } = await supabase
      .from("v_rentabilidad_producto")
      .select("*")
      .order("rentabilidad", { ascending: false })
      .limit(1);
    if (!error && data?.length) setMostRentable(data[0]);
  };

  const sell = async (product) => {
    if (!product) return;
    // Público debe confirmar venta
    if (
      !session?.user &&
      !confirm("No autenticado: venderá como público. Confirmar venta?")
    )
      return;

    // Verificar inventario
    const { data: pis } = await supabase
      .from("producto_ingrediente")
      .select("ingrediente_id")
      .eq("producto_id", product.id);
    const ingIds = (pis || []).map((x) => x.ingrediente_id);
    const { data: ingredients } = await supabase
      .from("ingredientes")
      .select("*")
      .in("id", ingIds);

    const lacking = ingredients.find((i) => i.inventario <= 0);
    if (lacking) return alert("Ingrediente agotado: " + lacking.nombre);

    // Descontar inventario
    for (const ing of ingredients) {
      const newInv = Math.max(ing.inventario - 1, 0);
      await supabase
        .from("ingredientes")
        .update({ inventario: newInv })
        .eq("id", ing.id);
    }

    // Registrar venta
    const total = product.precio_publico || 0;
    const userId = userProfile?.id || null;
    const { error } = await supabase
      .from("ventas")
      .insert([
        { producto_id: product.id, user_id: userId, cantidad: 1, total },
      ]);
    if (error) return alert(error.message);

    alert("Venta registrada por " + total);
    fetchProducts();
  };

  return (
    <section>
      <h2>Productos</h2>

      {/* Mostrar rentabilidad solo a admin */}
      {mostRentable && userProfile?.rol === "admin" && (
        <div className="alert alert-info">
          Producto más rentable: <strong>{mostRentable.nombre}</strong>{" "}
          Rentabilidad: {mostRentable.rentabilidad}
        </div>
      )}

      {loading ? (
        <div>Cargando productos...</div>
      ) : (
        <div className="row">
          {products.map((p) => (
            <div className="col-md-6" key={p.id}>
              <div className="card mb-3 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    {p.nombre} <small className="text-muted">({p.tipo})</small>
                  </h5>
                  <p>Precio público: {p.precio_publico}</p>
                  <p>
                    Vaso: {p.vaso} Volumen: {p.volumen_onzas || "-"}
                  </p>

                  <div className="d-flex gap-2">
                    {/* Botón de venta visible a todos excepto público no confirmado */}
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => sell(p)}
                    >
                      Vender
                    </button>

                    {/* Botón de info con restricciones */}
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={async () => {
                        const c = await supabase
                          .from("v_calorias_producto")
                          .select("total_calorias")
                          .eq("producto_id", p.id)
                          .single();

                        let msg =
                          "Calorías: " + (c.data?.total_calorias ?? "N/D");

                        // Admin puede ver costo + rentabilidad
                        if (userProfile?.rol === "admin") {
                          const cost = await supabase
                            .from("v_costo_producto")
                            .select("costo")
                            .eq("producto_id", p.id)
                            .single();
                          const rent = await supabase
                            .from("v_rentabilidad_producto")
                            .select("rentabilidad")
                            .eq("producto_id", p.id)
                            .single();
                          msg +=
                            "\\nCosto: " +
                            (cost.data?.costo ?? "N/D") +
                            "\\nRentabilidad: " +
                            (rent.data?.rentabilidad ?? "N/D");
                        }

                        alert(msg);
                      }}
                    >
                      Ver información
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
