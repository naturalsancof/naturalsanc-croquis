export const metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default function AdminHome() {
  return (
    <div className="grid h-full place-items-center px-10">
      <p className="text-[15px] text-mist">选左边一条，或点「+」新开一条。</p>
    </div>
  );
}
