"use client";

import { useEffect, useRef, type ComponentProps, type CSSProperties, type ElementType } from "react";

type PropsMuncul<T extends ElementType> = {
  /** Elemen yang dirender, bawaan <div>. */
  as?: T;
  /** Jeda sebelum mulai (ms), untuk efek berurutan: tunda={i * 80}. */
  tunda?: number;
} & Omit<ComponentProps<T>, "as">;

/**
 * Konten tampil perlahan (fade + geser ke atas) saat pertama kali masuk layar.
 *   <Muncul>...</Muncul>
 *   {items.map((x, i) => <Muncul key={x.id} as="li" tunda={i * 80}>...</Muncul>)}
 * Gayanya ada di globals.css ([data-muncul]); pengguna yang memilih
 * "kurangi gerakan" langsung melihat kontennya tanpa animasi.
 */
export function Muncul<T extends ElementType = "div">({ as, tunda = 0, style, ...props }: PropsMuncul<T>) {
  const Elemen: ElementType = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pengamat = new IntersectionObserver(
      ([entri]) => {
        if (!entri.isIntersecting) return;
        el.dataset.muncul = "ya";
        pengamat.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return (
    <Elemen
      ref={ref}
      data-muncul=""
      style={{ ...(style as CSSProperties), "--tunda": `${tunda}ms` } as CSSProperties}
      {...props}
    />
  );
}
