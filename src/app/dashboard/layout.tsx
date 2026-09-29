import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { logout } from "@/app/login/actions";
import { wajibLogin } from "@/lib/auth/dal";
import { menuUntuk } from "@/lib/auth/menu";
import { LABEL_ROLE } from "@/lib/auth/role";

export default async function LayoutDashboard({ children }: LayoutProps<"/dashboard">) {
  const pegawai = await wajibLogin();

  return (
    <ShellDashboard
      menu={menuUntuk(pegawai.roles)}
      namaPegawai={pegawai.namaLengkap}
      labelRole={pegawai.roles.map((r) => LABEL_ROLE[r]).join(", ") || "Tanpa role"}
      aksiLogout={logout}
    >
      {children}
    </ShellDashboard>
  );
}
