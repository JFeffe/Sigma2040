import {BUILD_VERSION} from './build-version.js?v=247';

const titlePrint=`./assets/menu-title-graphite.png?v=${BUILD_VERSION}`;
const titleMetal=`./assets/brand-triangle.png?v=${BUILD_VERSION}`;

// These contours follow the lettering in the approved title artwork.
const shadowContours=`
 M524 141 Q497 145 491 169 L485 200 Q482 215 497 226 L537 257 L533 284 Q532 291 525 291 L514 291 Q508 291 509 284 L513 258 L478 258 L472 293 Q470 311 486 320 Q491 324 503 324 L536 323 Q554 321 567 302 L574 254 Q576 241 569 236 L527 201 Q522 198 523 192 L526 177 Q527 171 533 171 L548 171 Q553 172 552 178 L548 198 L583 197 L588 167 Q590 155 575 145 Q569 141 559 141 Z
 M600 141 H638 L625 214 H653 L667 141 H704 L673 323 H637 L648 245 H621 L610 323 H574 Z
 M743 143 Q745 141 749 141 H780 Q784 141 784 145 L794 323 H759 L757 285 H726 L716 323 H679 Z M755 192 L735 255 H756 Z
 M829 141 H889 Q899 141 908 151 Q917 158 916 168 L898 297 Q896 310 880 319 Q874 323 865 323 H799 L826 149 Q827 144 829 141 Z M857 172 L839 291 H856 Q863 288 865 281 L880 179 Q881 173 875 172 Z
 M958 141 H992 Q1006 141 1016 152 Q1025 161 1024 171 L1008 297 Q1007 307 994 316 Q985 324 974 324 H937 Q923 324 914 313 Q907 305 909 293 L926 171 Q928 155 946 145 Q952 142 958 141 Z M966 172 Q962 173 961 179 L946 282 Q945 290 952 291 H966 Q972 289 973 282 L986 180 Q987 173 980 172 Z
 M1029 142 H1065 L1068 248 L1101 147 Q1102 142 1107 142 H1131 L1138 248 L1169 147 Q1170 142 1175 142 H1206 Q1211 142 1209 147 L1151 324 H1114 L1104 237 L1077 324 H1041 Z
`;
const mandateContours=`
 M486 335 H533 L559 422 L604 335 H645 L628 524 H590 L599 425 L561 501 H544 L521 425 L517 524 H479 Z
 M691 335 H735 L761 524 H724 L720 488 H684 L674 524 H635 Z M709 381 L691 457 H717 Z
 M782 335 H814 L846 429 L855 335 H893 L874 524 H840 L811 430 L803 524 H766 Z
 M907 335 H978 Q986 335 993 342 L1004 353 Q1009 359 1008 368 L995 499 Q994 508 980 518 Q975 524 965 524 H889 Z M942 365 L929 492 H950 Q957 491 960 484 L970 375 Q970 367 963 365 Z
 M1054 335 H1098 L1126 524 H1086 L1083 488 H1047 L1037 524 H998 Z M1073 380 L1055 457 H1080 Z
 M1124 335 H1231 L1225 366 H1194 L1175 524 H1137 L1157 366 H1120 Z
 M1239 335 H1328 L1319 366 H1273 L1267 410 H1310 L1300 442 H1262 L1255 491 H1307 L1298 524 H1211 Z
`;
const yearContours=`
 M501 564 H533 L541 572 L537 597 L497 620 L496 623 H532 L529 638 H477 L481 611 L521 588 L523 578 H505 L503 587 H486 L488 573 Z
 M560 564 H592 L600 572 L590 629 L579 638 H547 L538 629 L548 573 Z M565 578 L557 623 H574 L582 578 Z
 M635 564 H656 L648 609 H655 L653 623 H646 L643 638 H626 L629 623 H596 L599 608 Z M636 582 L616 609 H632 Z
 M678 564 H711 L719 572 L710 629 L698 638 H665 L657 629 L667 573 Z M684 578 L675 623 H694 L701 578 Z
`;

export function compactBrandMarkup(){
 const word=(contours,placement)=>`<g transform="${placement}">
  <image href="${titlePrint}" width="1536" height="1024" clip-path="path(evenodd, '${contours.trim().replace(/\s+/g,' ')}')"/>
 </g>`;
 return `<div class="brand" role="img" aria-label="Shadow Mandate 2040" translate="no">
  <svg class="brand-mark" viewBox="71 173 1112 937" aria-hidden="true">
   <image href="${titleMetal}" width="1254" height="1254"/>
  </svg>
  <div class="brand-wordmark" aria-hidden="true">
   <svg viewBox="0 0 1592 312" width="1592" height="312">
    ${word(shadowContours,'translate(-470 -139)')}
    ${word(mandateContours,'translate(775 2) scale(.958) translate(-478 -335)')}
    ${word(yearContours,'translate(0 210) scale(1.32) translate(-476 -564)')}
   </svg>
  </div>
 </div>`;
}

// The viewBox and cut lines use pixels in the approved 1536 × 1024 title artwork.
// The same two registered pieces draw both the opening and the resting menu title.
export function menuTitleMarkup(){
 return `<svg class="menu-title-art" viewBox="96 64 1280 760" width="1280" height="760" role="img" aria-label="Shadow Mandate 2040">
  <defs>
   <image id="menu-title-print" href="${titlePrint}" width="1536" height="1024"/>
   <image id="menu-title-metal" href="${titleMetal}" width="1254" height="1254"/>
   <pattern id="menu-title-plate-grain" patternUnits="userSpaceOnUse" width="1254" height="1254"><use href="#menu-title-metal"/></pattern>
   <linearGradient id="menu-title-patina" x2="0" y2="1">
    <stop stop-opacity=".02"/><stop offset=".6" stop-opacity=".27"/><stop offset="1" stop-opacity=".32"/>
   </linearGradient>
   <clipPath id="menu-title-outline"><path d="M129 101 Q131 99 139 100 L865 101 L541 808 Z"/></clipPath>
   <path id="menu-title-glyphs" fill-rule="evenodd" clip-rule="evenodd" d="${shadowContours}${mandateContours}${yearContours}"/>
   <clipPath id="menu-title-type-cut"><use href="#menu-title-glyphs"/></clipPath>
   <filter id="menu-title-feather" x="-12%" y="-15%" width="124%" height="130%"><feGaussianBlur stdDeviation="10"/></filter>
   <!-- The clean plate carries the bevel through the tip. Feather the printed texture before it. -->
   <linearGradient id="menu-title-lower-feather" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="615" y2="705">
    <stop stop-color="white"/><stop offset="1" stop-color="black"/>
   </linearGradient>
   <mask id="menu-title-exposed-metal" maskUnits="userSpaceOnUse" x="96" y="64" width="1280" height="760">
    <rect x="96" y="64" width="1280" height="760" fill="url(#menu-title-lower-feather)"/>
    <rect x="442" y="110" width="900" height="562" rx="21" fill="black" filter="url(#menu-title-feather)"/>
   </mask>
   <filter id="menu-title-contact" x="-12%" y="-16%" width="124%" height="140%" color-interpolation-filters="sRGB">
    <feDropShadow dx="5" dy="12" stdDeviation="8" flood-opacity=".84"/>
    <feDropShadow dx="2" dy="4" stdDeviation="2" flood-opacity=".9"/>
   </filter>
  </defs>
  <g class="menu-title-piece menu-title-triangle">
   <g clip-path="url(#menu-title-outline)">
    <!-- The three textures of the clean plate meet along the bevels of the approved print. -->
    <g fill="url(#menu-title-plate-grain)" stroke="url(#menu-title-plate-grain)" stroke-width="3" stroke-linejoin="round">
     <path d="M77 180 L1021 180 746 390 Z" transform="matrix(0.65678 0 0.060069 0.657143 68.615617 -17.285714)"/>
     <path d="M77 180 L746 390 630 390 Z" transform="matrix(0.913793 0 -0.758703 0.657143 196.204433 -17.285714)"/>
     <path d="M77 180 L630 390 330 590 Z" transform="matrix(0.626037 0.005357 -0.000945 0.643036 81.965207 -15.158929)"/>
     <path d="M1021 180 L1176 180 768 445 Z" transform="matrix(0.741935 0 0.134753 0.656604 -31.771759 -17.188679)"/>
     <path d="M1021 180 L768 445 746 390 Z" transform="matrix(0.638136 -0.001519 0.035655 0.655153 92.045075 -15.376298)"/>
     <path d="M746 390 L768 445 648 445 Z" transform="matrix(0.925 0 -0.079091 0.654545 -77.204545 -16.272727)"/>
     <path d="M746 390 L648 445 630 390 Z" transform="matrix(0.913793 0 -0.09906 0.654545 -61.056426 -16.272727)"/>
     <path d="M630 390 L648 445 357 645 Z" transform="matrix(0.611579 0.005356 -0.000153 0.652793 90.765111 -18.963275)"/>
     <path d="M630 390 L357 645 330 590 Z" transform="matrix(0.663927 0.028082 0.05589 0.677123 35.928767 -42.769863)"/>
     <path d="M623 1103 L357 645 648 445 Z" transform="matrix(0.686 0.115392 0.108131 0.812895 -5.646489 -161.511969)"/>
     <path d="M623 1103 L648 445 768 445 Z" transform="matrix(0.925 0 0.117211 0.808511 -164.559005 -84.787234)"/>
     <path d="M623 1103 L768 445 1176 180 Z" transform="matrix(0.69806 0.115146 0.067202 0.833885 31.985268 -184.510579)"/>
    </g>
    <rect x="129" y="99" width="740" height="710" fill="url(#menu-title-patina)"/>
    <use href="#menu-title-print" mask="url(#menu-title-exposed-metal)"/>
   </g>
  </g>
  <g class="menu-title-piece menu-title-lettering">
   <g filter="url(#menu-title-contact)"><use href="#menu-title-print" clip-path="url(#menu-title-type-cut)"/></g>
  </g>
  <g class="menu-title-original" aria-hidden="true">
   <use href="#menu-title-print" clip-path="polygon(115px 89px,886px 89px,867px 131px,1225px 131px,1169px 327px,1344px 327px,1309px 538px,682px 538px,674px 554px,737px 554px,724px 650px,626px 650px,541px 821px)"/>
  </g>
 </svg>`;
}
