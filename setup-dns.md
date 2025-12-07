# 🌐 Configuración de DNS Local para Subdominios

## 📋 Descripción

Para que el sistema multi-tenancy funcione correctamente con subdominios, necesitas configurar tu sistema para resolver subdominios como `gus-main.localhost`, `pizza-palace.localhost`, etc.

## 🖥️ Windows

### Opción 1: Archivo hosts (Recomendado)

1. Abrir el archivo hosts como administrador:

   ```
   C:\Windows\System32\drivers\etc\hosts
   ```

2. Agregar las siguientes líneas:

   ```
   127.0.0.1 localhost
   127.0.0.1 gus-main.localhost
   127.0.0.1 pizza-palace.localhost
   127.0.0.1 test-restaurant.localhost
   ```

3. Guardar el archivo

### Opción 2: PowerShell (Automático)

Ejecutar como administrador:

```powershell
# Agregar entradas al archivo hosts
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 gus-main.localhost"
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 pizza-palace.localhost"
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 test-restaurant.localhost"
```

## 🐧 Linux/macOS

### Opción 1: Archivo hosts

1. Editar el archivo hosts:

   ```bash
   sudo nano /etc/hosts
   ```

2. Agregar las líneas:

   ```
   127.0.0.1 localhost
   127.0.0.1 gus-main.localhost
   127.0.0.1 pizza-palace.localhost
   127.0.0.1 test-restaurant.localhost
   ```

3. Guardar y salir

### Opción 2: Script automático

```bash
# Crear script de configuración
cat > setup-dns.sh << 'EOF'
#!/bin/bash
echo "Configurando DNS local para subdominios..."

# Verificar si las entradas ya existen
if ! grep -q "gus-main.localhost" /etc/hosts; then
    echo "127.0.0.1 gus-main.localhost" | sudo tee -a /etc/hosts
fi

if ! grep -q "pizza-palace.localhost" /etc/hosts; then
    echo "127.0.0.1 pizza-palace.localhost" | sudo tee -a /etc/hosts
fi

if ! grep -q "test-restaurant.localhost" /etc/hosts; then
    echo "127.0.0.1 test-restaurant.localhost" | sudo tee -a /etc/hosts
fi

echo "✅ DNS configurado correctamente"
EOF

# Hacer ejecutable y ejecutar
chmod +x setup-dns.sh
sudo ./setup-dns.sh
```

## 🔧 Verificación

### 1. Probar resolución DNS

```bash
# Windows
nslookup gus-main.localhost

# Linux/macOS
nslookup gus-main.localhost
# o
ping gus-main.localhost
```

### 2. Probar acceso web

```bash
# Usando curl
curl -I http://gus-main.localhost:3001

# Usando wget
wget -q --spider http://gus-main.localhost:3001
```

### 3. Probar desde navegador

- Abrir: `http://gus-main.localhost:3001`
- Debería mostrar la página del restaurante

## 🚨 Solución de Problemas

### Error: "No se puede resolver el nombre del host"

1. **Verificar archivo hosts**

   ```bash
   # Windows
   type C:\Windows\System32\drivers\etc\hosts

   # Linux/macOS
   cat /etc/hosts
   ```

2. **Limpiar caché DNS**

   ```bash
   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemctl restart systemd-resolved

   # macOS
   sudo dscacheutil -flushcache
   ```

3. **Reiniciar navegador**
   - Cerrar completamente el navegador
   - Abrir nuevamente

### Error: "Conexión rechazada"

1. **Verificar que el servidor esté ejecutándose**

   ```bash
   # Verificar puertos en uso
   netstat -an | grep :3001
   ```

2. **Verificar firewall**

   - Asegurarse de que el puerto 3001 esté permitido

3. **Verificar que la instancia esté activa**
   ```bash
   curl http://localhost:3000/api/system/status
   ```

## 🔄 Agregar Nuevos Subdominios

Cuando crees nuevos restaurantes, necesitarás agregar sus subdominios al archivo hosts:

### Windows

```cmd
echo 127.0.0.1 nuevo-restaurante.localhost >> C:\Windows\System32\drivers\etc\hosts
```

### Linux/macOS

```bash
echo "127.0.0.1 nuevo-restaurante.localhost" | sudo tee -a /etc/hosts
```

## 📝 Notas Importantes

1. **Permisos de administrador**: Editar el archivo hosts requiere permisos de administrador
2. **Caché del navegador**: Algunos navegadores cachean DNS, reiniciar puede ser necesario
3. **Puertos**: Asegúrate de que los puertos asignados estén disponibles
4. **Firewall**: Verifica que el firewall no bloquee las conexiones locales

## 🎯 URLs de Prueba

Una vez configurado, podrás acceder a:

- **Panel de Control**: `http://localhost:3000/master`
- **Gus Restaurant**: `http://gus-main.localhost:3001`
- **Pizza Palace**: `http://pizza-palace.localhost:3002`
- **Test Restaurant**: `http://test-restaurant.localhost:9999`

---

**Configuración completada** ✅
