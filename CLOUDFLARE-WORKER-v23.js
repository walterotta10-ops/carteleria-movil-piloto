export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    await prepararBase(env);

    if (url.pathname === "/health") {
      return json({ ok: true, servicio: "Carteleria Puente Carta", version: "v23" }, cors);
    }

    if (url.pathname === "/trabajo" && request.method === "POST") {
      const data = await request.json();
      const local = String(data.local || "").trim();
      const printerIp = String(data.printer_ip || data.impresora_ip || "").trim();
      const contenido = String(data.contenido || "").trim();
      if (!local || !printerIp || !contenido) return json({ ok:false, error:"Falta local, IP o contenido" }, cors, 400);

      const result = await env.DB.prepare(`
        INSERT INTO trabajos (local, printer_ip, contenido, estado)
        VALUES (?, ?, ?, 'pendiente')
      `).bind(local, printerIp, contenido).run();

      return json({ ok:true, id:result.meta.last_row_id, local, printer_ip:printerIp, estado:"pendiente" }, cors);
    }

    // v23: puentes antiguos dejan de recibir trabajos para evitar impresiones duplicadas o JSON en papel.
    if (url.pathname === "/siguiente" && request.method === "GET") {
      return json({ ok:true, trabajo:null, mensaje:"Actualiza al Puente Carta v23" }, cors);
    }

    // Reclamo seguro: solo un puente puede cambiar el trabajo de pendiente a imprimiendo.
    if (url.pathname === "/tomar" && request.method === "POST") {
      const local = String(url.searchParams.get("local") || "").trim();
      if (!local) return json({ ok:false, error:"Falta local" }, cors, 400);

      const candidato = await env.DB.prepare(`
        SELECT id FROM trabajos
        WHERE local = ? AND estado = 'pendiente'
        ORDER BY id ASC LIMIT 1
      `).bind(local).first();

      if (!candidato) return json({ ok:true, trabajo:null }, cors);

      const claim = await env.DB.prepare(`
        UPDATE trabajos SET estado='imprimiendo', tomado=CURRENT_TIMESTAMP
        WHERE id=? AND estado='pendiente'
      `).bind(candidato.id).run();

      if (!claim.meta || Number(claim.meta.changes || 0) !== 1) return json({ ok:true, trabajo:null }, cors);

      const trabajo = await env.DB.prepare(`
        SELECT id, local, printer_ip, contenido, estado, creado, tomado
        FROM trabajos WHERE id=?
      `).bind(candidato.id).first();

      return json({ ok:true, trabajo:trabajo || null }, cors);
    }

    if (url.pathname === "/impreso" && request.method === "POST") {
      const data = await request.json();
      const id = Number(data.id);
      if (!id) return json({ ok:false, error:"Falta id" }, cors, 400);
      await env.DB.prepare(`
        UPDATE trabajos SET estado='impreso', impreso=CURRENT_TIMESTAMP
        WHERE id=? AND estado='imprimiendo'
      `).bind(id).run();
      return json({ ok:true, id, estado:"impreso", eliminar_en_minutos:20 }, cors);
    }

    if (url.pathname === "/fallo" && request.method === "POST") {
      const data = await request.json();
      const id = Number(data.id);
      if (!id) return json({ ok:false, error:"Falta id" }, cors, 400);
      await env.DB.prepare(`
        UPDATE trabajos SET estado='error', impreso=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(id).run();
      return json({ ok:true, id, estado:"error" }, cors);
    }

    return json({ ok:true, mensaje:"Carteleria Puente Carta activo", version:"v23" }, cors);
  },

  async scheduled(controller, env, ctx) {
    await prepararBase(env);
    // Si un PC cae mientras estaba imprimiendo, libera el trabajo para reintentar después de 10 min.
    await env.DB.prepare(`
      UPDATE trabajos SET estado='pendiente', tomado=NULL
      WHERE estado='imprimiendo' AND tomado IS NOT NULL
        AND datetime(tomado) <= datetime('now','-10 minutes')
    `).run();

    await env.DB.prepare(`
      DELETE FROM trabajos
      WHERE estado IN ('impreso','error') AND impreso IS NOT NULL
        AND datetime(impreso) <= datetime('now','-20 minutes')
    `).run();
  },
};

async function prepararBase(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS trabajos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local TEXT NOT NULL,
      printer_ip TEXT,
      contenido TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      creado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      tomado TEXT,
      impreso TEXT
    )
  `).run();

  for (const sql of [
    `ALTER TABLE trabajos ADD COLUMN printer_ip TEXT`,
    `ALTER TABLE trabajos ADD COLUMN tomado TEXT`
  ]) {
    try { await env.DB.prepare(sql).run(); } catch (e) {}
  }
}

function json(data, cors, status=200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers:{ ...cors, "Content-Type":"application/json; charset=UTF-8" }
  });
}
