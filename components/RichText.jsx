import { Fragment } from "react";

// Renders admin-edited text.
//   *word*            -> highlighted in the brand colour
//   {price} {name}... -> replaced from `vars`
//   new lines         -> line breaks
export default function RichText({ text, vars = {} }) {
  const filled = String(text ?? "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return (
    <>
      {filled.split(/\r?\n/).map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <span key={i} className="text-brand">{part}</span> : part))}
        </Fragment>
      ))}
    </>
  );
}
