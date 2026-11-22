# Defensa del anteproyecto · Metodología de la investigación

Presentación de la defensa del obligatorio (ORT, 23/11/2026).
**Factores asociados a la confianza de estudiantes y egresados de Sistemas en Uruguay en los asistentes de inteligencia artificial generativa.**

Jorge Pacheco · Rodrigo Guerra · Juan Manuel Fernández — Docente: Gerardo Matturro

## Cómo abrirla

Abrir `index.html` en el navegador (doble clic). No necesita internet ni instalar nada: las tipografías están en `fonts/`.

| Tecla | Qué hace |
|---|---|
| `→` `Espacio` `Enter` / clic | Siguiente |
| `←` / clic en el borde izquierdo | Anterior |
| `P` | Modo presentador: ventana aparte con la miniatura de la diapositiva en pantalla y de la siguiente, las notas del orador (letra ajustable con A− / A+), quién habla y un cronómetro (límite 10:00) |
| `F` | Pantalla completa |
| `Inicio` / `Fin` | Primera / última diapositiva |

El cronómetro arranca solo al pasar de la portada. La dirección cambia con cada diapositiva (`index.html#7`), así que se puede recargar sin perder el lugar.

**Para presentar:** abrir `index.html`, tocar `P` y mover la ventana de notas a la pantalla de la notebook; dejar la presentación en el proyector y tocar `F`.

## Cómo editarla

Todo el contenido está en `index.html`. Cada diapositiva es un bloque:

```html
<section class="slide" data-section="Propósito" data-speaker="Jorge">
  <p class="eyebrow">Propósito · El problema</p>
  <h2>Título de la diapositiva</h2>
  ...
  <aside class="notes" data-time="0:20 – 1:05">Lo que se dice en voz alta.</aside>
</section>
```

- **Texto de la diapositiva:** se edita directo en el HTML.
- **Notas del orador:** van en `<aside class="notes">`. No se ven en la presentación, solo en el modo presentador. `data-time` es el minuto previsto.
- **Regla del pie** (sección y número): se genera sola a partir de `data-section`. `data-speaker` solo se usa en el modo presentador. Si se agrega o se saca una diapositiva, se actualiza.
- **Colores y tipografías:** variables al principio de `styles.css` (`--teal`, `--warn`, `--paper`…).
- El lienzo mide 1920 × 1080 px y se escala a la ventana. Si agregan texto, revisen que no se pase del pie.

## Archivos

```
index.html   contenido y notas
styles.css   diseño
deck.js      navegación, regla de progreso y modo presentador
fonts/       Newsreader, IBM Plex Sans e IBM Plex Mono (licencia SIL OFL 1.1)
respaldo/    defensa.pdf, por si falla el navegador del aula
```

## PDF de respaldo

`respaldo/defensa.pdf` es una copia de las 13 diapositivas. Si cambian el contenido, se vuelve a generar: abrir `index.html` en Chrome, `Ctrl/Cmd + P`, destino «Guardar como PDF», márgenes «Ninguno» y activar «Gráficos de fondo».

## Trabajar entre los tres

```bash
git pull                      # antes de empezar
# ...editar...
git add -A && git commit -m "Ajusta notas de la diapositiva 7"
git push
```

Para evitar conflictos, avisen en el grupo qué diapositiva está tocando cada uno.
