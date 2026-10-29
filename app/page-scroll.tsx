import type {ReactNode,Ref} from 'react';

// globals.css locks html, body and #root for the atlas, so a page taller than
// the screen has to scroll inside its own layer. The account and quiz pages do
// this in their CSS; the paper pages (exam, admin) render their <main> through
// this instead. `ref` points at the scrolling layer, not at the <main>.
export default function PageScroll({className,children,ref}:{className?:string;children:ReactNode;ref?:Ref<HTMLDivElement>}){
  return(
    <div ref={ref} className="fixed inset-0 overflow-x-hidden overflow-y-auto overscroll-contain">
      <main className={className}>{children}</main>
    </div>
  );
}
