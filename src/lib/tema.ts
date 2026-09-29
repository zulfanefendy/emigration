// Dipakai bersama oleh root layout (server) dan ToggleTema (client).
export type Tema = "light" | "dark";
export const KUNCI_TEMA = "tema";

/** Dijalankan di <head> sebelum halaman tampil agar tema tidak berkedip. Bawaan: terang. */
export const SKRIP_TEMA = `(function(){try{var t=localStorage.getItem("${KUNCI_TEMA}");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})()`;
