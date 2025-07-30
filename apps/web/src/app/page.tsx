import Link from 'next/link';

export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <div className="border p-6">
      <Link href="./dashboard">Go to dashboard</Link>
    </div>
  );
}
