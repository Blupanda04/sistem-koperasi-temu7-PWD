   // ------------------ helpers & storage ------------------
    const DB = {
      anggota: JSON.parse(localStorage.getItem('kop_anggota')||'[]'),
      simpanan: JSON.parse(localStorage.getItem('kop_simpanan')||'[]'),
      pinjaman: JSON.parse(localStorage.getItem('kop_pinjaman')||'[]')
    }

    function saveDB(){
      localStorage.setItem('kop_anggota', JSON.stringify(DB.anggota));
      localStorage.setItem('kop_simpanan', JSON.stringify(DB.simpanan));
      localStorage.setItem('kop_pinjaman', JSON.stringify(DB.pinjaman));
      renderAll();
    }

    function uid(prefix='ID'){ return prefix + '-' + Math.random().toString(36).slice(2,9).toUpperCase(); }

    // ------------------ navigation ------------------
    document.querySelectorAll('.menu-link').forEach(a=>a.addEventListener('click', (e)=>{
      e.preventDefault(); document.querySelectorAll('.menu-link').forEach(x=>x.classList.remove('active'));
      e.target.classList.add('active'); document.querySelectorAll('.view').forEach(v=>v.style.display='none');
      const id = e.target.getAttribute('href').slice(1); document.getElementById(id).style.display='block';
    }));

    // ------------------ Clock ------------------
    function updateClock(){ document.getElementById('clock').textContent = new Date().toLocaleString(); }
    setInterval(updateClock,1000); updateClock();

    // ------------------ Anggota ------------------
    function renderAnggotaSelects(){
      const ss = document.querySelectorAll('#simpananAnggota,#pinjamanAnggota');
      ss.forEach(s=>{ s.innerHTML = '<option value="">-- pilih anggota --</option>'; DB.anggota.forEach(a=>{ const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.nama + ' ('+a.id+')'; s.appendChild(opt); })});
    }

    function renderAnggotaTable(){
      const q = document.getElementById('searchAnggota').value.toLowerCase();
      const tbody = document.querySelector('#tableAnggota tbody'); tbody.innerHTML='';
      DB.anggota.filter(a=>!q||a.nama.toLowerCase().includes(q)||a.id.toLowerCase().includes(q)).forEach(a=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${a.id}</td><td>${a.nama}</td><td>${a.telp||''}</td><td><button onclick="editAnggota('${a.id}')">Edit</button> <button onclick="hapusAnggota('${a.id}')" style=\"background:#ef4444\">Hapus</button></td>`;
        tbody.appendChild(tr);
      })
    }

    function saveAnggota(){
      const id = document.getElementById('anggotaId').value || uid('AG');
      const nama = document.getElementById('anggotaNama').value.trim();
      if(!nama){alert('Nama wajib diisi');return}
      const telp = document.getElementById('anggotaTelp').value.trim();
      const alamat = document.getElementById('anggotaAlamat').value.trim();
      const exist = DB.anggota.find(a=>a.id===id);
      if(exist){ Object.assign(exist,{nama,telp,alamat}); } else { DB.anggota.push({id,nama,telp,alamat,join:new Date().toISOString()}); }
      saveDB(); resetForm();
    }

    function editAnggota(id){ const a = DB.anggota.find(x=>x.id===id); if(!a) return; document.getElementById('anggotaId').value = a.id; document.getElementById('anggotaNama').value = a.nama; document.getElementById('anggotaTelp').value = a.telp; document.getElementById('anggotaAlamat').value = a.alamat; }
    function hapusAnggota(id){ if(!confirm('Hapus anggota?')) return; DB.anggota = DB.anggota.filter(a=>a.id!==id); // also remove related transactions
      DB.simpanan = DB.simpanan.filter(s=>s.anggotaId!==id);
      DB.pinjaman = DB.pinjaman.filter(p=>p.anggotaId!==id);
      saveDB(); }
    function resetForm(){ document.getElementById('anggotaId').value=''; document.getElementById('anggotaNama').value=''; document.getElementById('anggotaTelp').value=''; document.getElementById('anggotaAlamat').value=''; }

    // ------------------ Simpanan ------------------
    function renderSimpananTable(){
      const q = document.getElementById('searchSimpanan').value.toLowerCase(); const tbody = document.querySelector('#tableSimpanan tbody'); tbody.innerHTML='';
      DB.simpanan.filter(s=>{
        const a = getAnggota(s.anggotaId); return !q || (a && a.nama.toLowerCase().includes(q)) || (s.ket && s.ket.toLowerCase().includes(q));
      }).forEach(s=>{
        const tr = document.createElement('tr'); const a = getAnggota(s.anggotaId);
        tr.innerHTML = `<td>${formatDate(s.tgl)}</td><td>${a? a.nama : s.anggotaId}</td><td>Rp ${numberFormat(s.jumlah)}</td><td>${s.ket||''}</td><td><button onclick="hapusSimpanan('${s.id}')" style=\"background:#ef4444\">Hapus</button></td>`;
        tbody.appendChild(tr);
      })
    }

    function addSimpanan(){ const anggotaId = document.getElementById('simpananAnggota').value; if(!anggotaId){alert('Pilih anggota');return}
      const jumlah = parseFloat(document.getElementById('simpananJumlah').value); if(!jumlah || jumlah<=0){alert('Jumlah tidak valid');return}
      const ket = document.getElementById('simpananKeterangan').value||'Setoran tunai';
      const rec = {id:uid('S'), anggotaId, jumlah, ket, tgl:new Date().toISOString()}; DB.simpanan.push(rec); saveDB(); document.getElementById('simpananJumlah').value=''; document.getElementById('simpananKeterangan').value='';
    }
    function hapusSimpanan(id){ if(!confirm('Hapus simpanan?')) return; DB.simpanan = DB.simpanan.filter(s=>s.id!==id); saveDB(); }

    // ------------------ Pinjaman ------------------
    function renderPinjamanTable(){ const q = document.getElementById('searchPinjaman').value.toLowerCase(); const tbody = document.querySelector('#tablePinjaman tbody'); tbody.innerHTML='';
      DB.pinjaman.filter(p=>{
        const a = getAnggota(p.anggotaId); return !q || (a && a.nama.toLowerCase().includes(q)) || (p.status && p.status.toLowerCase().includes(q));
      }).forEach(p=>{
        const tr = document.createElement('tr'); const a = getAnggota(p.anggotaId);
        tr.innerHTML = `<td>${formatDate(p.tgl)}</td><td>${a? a.nama : p.anggotaId}</td><td>Rp ${numberFormat(p.jumlah)}</td><td>${p.status}</td><td><button onclick="hapusPinjaman('${p.id}')" style=\"background:#ef4444\">Hapus</button></td>`;
        tbody.appendChild(tr);
      })
    }
    function addPinjaman(){ const anggotaId = document.getElementById('pinjamanAnggota').value; if(!anggotaId){alert('Pilih anggota');return}
      const jumlah = parseFloat(document.getElementById('pinjamanJumlah').value); if(!jumlah||jumlah<=0){alert('Jumlah tidak valid');return}
      const status = document.getElementById('pinjamanStatus').value; const rec = {id:uid('P'), anggotaId, jumlah, status, tgl:new Date().toISOString()}; DB.pinjaman.push(rec); saveDB(); document.getElementById('pinjamanJumlah').value='';
    }
    function hapusPinjaman(id){ if(!confirm('Hapus pinjaman?')) return; DB.pinjaman = DB.pinjaman.filter(p=>p.id!==id); saveDB(); }

    // ------------------ Transaksi (gabungan) ------------------
    function renderTransaksi(){ const tbody = document.querySelector('#tableTransaksi tbody'); tbody.innerHTML='';
      const all = [];
      DB.simpanan.forEach(s=> all.push({tgl:s.tgl, tipe:'Simpanan', anggotaId:s.anggotaId, jumlah:s.jumlah, ket:s.ket}));
      DB.pinjaman.forEach(p=> all.push({tgl:p.tgl, tipe:'Pinjaman', anggotaId:p.anggotaId, jumlah:p.jumlah, ket:p.status}));
      all.sort((a,b)=> new Date(b.tgl)-new Date(a.tgl));
      all.forEach(x=>{ const a = getAnggota(x.anggotaId); const tr = document.createElement('tr'); tr.innerHTML = `<td>${formatDate(x.tgl)}</td><td>${x.tipe}</td><td>${a? a.nama : x.anggotaId}</td><td>Rp ${numberFormat(x.jumlah)}</td><td>${x.ket||''}</td>`; tbody.appendChild(tr); })
    }

    // ------------------ utilities ------------------
    function getAnggota(id){ return DB.anggota.find(a=>a.id===id); }
    function formatDate(iso){ const d=new Date(iso); return d.toLocaleString(); }
    function numberFormat(n){ return Number(n).toLocaleString('id-ID'); }

    function renderStats(){ document.getElementById('stat-anggota').textContent = DB.anggota.length;
      const totalS = DB.simpanan.reduce((s,x)=>s+x.jumlah,0); document.getElementById('stat-simpanan').textContent = 'Rp ' + numberFormat(totalS);
      const totalP = DB.pinjaman.reduce((s,x)=>s+x.jumlah,0); document.getElementById('stat-pinjaman').textContent = 'Rp ' + numberFormat(totalP);
    }

    function renderAll(){ renderAnggotaTable(); renderSimpananTable(); renderPinjamanTable(); renderTransaksi(); renderAnggotaSelects(); renderStats(); }

    // ------------------ CSV Export ------------------
    function exportCSV(type){ let rows = []; if(type==='anggota'){ rows = [['ID','Nama','Telp','Alamat','Join']].concat(DB.anggota.map(a=>[a.id,a.nama,a.telp||' ',a.alamat||' ',a.join||''])); }
      if(type==='simpanan'){ rows = [['ID','Tgl','AnggotaID','Jumlah','Keterangan']].concat(DB.simpanan.map(s=>[s.id,s.tgl,s.anggotaId,s.jumlah,s.ket||''])); }
      if(type==='pinjaman'){ rows = [['ID','Tgl','AnggotaID','Jumlah','Status']].concat(DB.pinjaman.map(p=>[p.id,p.tgl,p.anggotaId,p.jumlah,p.status||''])); }
      const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download = `kop_${type}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    }

    // ------------------ sample data & clear ------------------
    function seedSample(){ if(!confirm('Isi data contoh? (akan menambah data)')) return; DB.anggota.push({id:'AG-001',nama:'Asep Budi',telp:'08123456789',alamat:'Jalan Merdeka'});
      DB.anggota.push({id:'AG-002',nama:'Siti Rahma',telp:'08129876543',alamat:'Komplek Melati'});
      DB.simpanan.push({id:uid('S'),anggotaId:'AG-001',jumlah:500000,ket:'Setoran awal',tgl:new Date().toISOString()});
      DB.pinjaman.push({id:uid('P'),anggotaId:'AG-002',jumlah:2000000,status:'Pengajuan',tgl:new Date().toISOString()}); saveDB(); }

    function clearAll(){ if(!confirm('Hapus semua data? Tindakan ini tidak bisa dibatalkan.')) return; DB.anggota=[];DB.simpanan=[];DB.pinjaman=[];saveDB(); }

    // ------------------ init ------------------
    renderAll();