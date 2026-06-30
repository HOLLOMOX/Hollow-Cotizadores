import type { ReactNode } from "react";
import NumberInputStepFix from "./NumberInputStepFix";

export default function CajasLuzLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <NumberInputStepFix />
      {children}
    </>
  );
}