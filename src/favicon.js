/**
 * Self-contained Earth Favicon with Bolivian Flag Colors (Rojo, Amarillo, Verde)
 * Represents Planet Earth with Bolivian Tricolor curved stripes, continents, and meridians.
 */

export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <!-- Sphere mask to clip all interior globe features into a perfect sphere -->
    <clipPath id="globe-clip">
      <circle cx="32" cy="32" r="27.5"/>
    </clipPath>

    <!-- Bolivian Tricolor Gradients (Spherical Depth) -->
    <!-- Top Stripe: Bolivian Red (Rojo) -->
    <linearGradient id="bol-red" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="25%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>

    <!-- Middle Stripe: Bolivian Gold/Yellow (Amarillo) -->
    <linearGradient id="bol-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>

    <!-- Bottom Stripe: Bolivian Green (Verde) -->
    <linearGradient id="bol-green" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>

    <!-- Spherical 3D Shading Overlay (Light from upper-left, shadow on lower-right) -->
    <radialGradient id="sphere-lighting" cx="30%" cy="26%" r="72%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="65%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="88%" stop-color="#000000" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </radialGradient>

    <!-- Atmosphere / Limb Glow -->
    <radialGradient id="atmo-glow" cx="50%" cy="50%" r="50%">
      <stop offset="85%" stop-color="#38bdf8" stop-opacity="0"/>
      <stop offset="96%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.75"/>
    </radialGradient>
  </defs>

  <!-- Outer Atmosphere Ring -->
  <circle cx="32" cy="32" r="29" fill="none" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.4"/>
  <circle cx="32" cy="32" r="28" fill="none" stroke="#0284c7" stroke-width="1.2" stroke-opacity="0.25"/>

  <!-- Globe Body with Bolivian Flag Colors -->
  <g clip-path="url(#globe-clip)">
    <!-- 1. Top Zone: Bolivian Red Stripe (curved spherical perspective) -->
    <path d="M 0 0 L 64 0 L 64 23.5 Q 32 27 0 23.5 Z" fill="url(#bol-red)"/>

    <!-- 2. Middle Zone: Bolivian Gold/Yellow Stripe -->
    <path d="M 0 23.5 Q 32 27 64 23.5 L 64 40.5 Q 32 44 0 40.5 Z" fill="url(#bol-yellow)"/>

    <!-- 3. Bottom Zone: Bolivian Green Stripe -->
    <path d="M 0 40.5 Q 32 44 64 40.5 L 64 64 L 0 64 Z" fill="url(#bol-green)"/>

    <!-- 4. Earth Continents Silhouettes (Centered on South America & Americas) -->
    <g fill="#ffffff" fill-opacity="0.28" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.45">
      <!-- North America -->
      <path d="M 14 12 Q 18 10 24 11 Q 28 14 26 19 Q 22 23 20 25 Q 16 23 15 19 Z"/>
      <!-- Central America Bridge -->
      <path d="M 20 25 Q 23 27 25 29 Q 23 30 21 27 Z"/>
      <!-- South America (Centered, where Bolivia is located) -->
      <path d="M 23 29 Q 31 28 35 34 Q 37 40 32 46 Q 28 52 25 54 Q 24 48 23 42 Q 20 35 23 29 Z"/>
      <!-- Bolivia Location Highlight Pin -->
      <circle cx="28" cy="38" r="1.5" fill="#fde047" stroke="#b91c1c" stroke-width="0.6"/>
      <!-- Europe & Africa on East limb -->
      <path d="M 47 14 Q 53 13 57 16 Q 54 21 49 20 Q 46 17 47 14 Z"/>
      <path d="M 48 24 Q 56 25 58 33 Q 56 43 51 46 Q 47 43 47 34 Q 45 28 48 24 Z"/>
    </g>

    <!-- 5. Earth Grid Lines: Parallels (Latitudes) & Meridians (Longitudes) -->
    <!-- Equator line -->
    <ellipse cx="32" cy="32" rx="27.5" ry="8" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-opacity="0.65"/>
    <!-- Northern Parallel -->
    <ellipse cx="32" cy="22" rx="25.5" ry="6.5" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-opacity="0.4" stroke-dasharray="2 1.5"/>
    <!-- Southern Parallel -->
    <ellipse cx="32" cy="42" rx="25.5" ry="6.5" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-opacity="0.4" stroke-dasharray="2 1.5"/>

    <!-- Central Meridian & Longitudes -->
    <line x1="32" y1="4.5" x2="32" y2="59.5" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.55"/>
    <ellipse cx="32" cy="32" rx="14.5" ry="27.5" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.45"/>
    <ellipse cx="32" cy="32" rx="22.5" ry="27.5" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.3"/>

    <!-- 6. 3D Spherical Volume Shading -->
    <circle cx="32" cy="32" r="27.5" fill="url(#sphere-lighting)"/>
    <circle cx="32" cy="32" r="27.5" fill="url(#atmo-glow)"/>
  </g>

  <!-- 7. Outer Globe Rim & Specular Glint -->
  <circle cx="32" cy="32" r="27.5" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.8"/>
  <ellipse cx="23" cy="18" rx="6.5" ry="3.5" transform="rotate(-35 23 18)" fill="#ffffff" fill-opacity="0.45"/>
</svg>`;

export const FAVICON_DATA_URI = 'data:image/svg+xml;utf8,' + encodeURIComponent(FAVICON_SVG);
