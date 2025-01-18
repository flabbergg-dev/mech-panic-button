import Hero from "@/components/hero";

export default async function Home() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Mech-Panic Button</h2>
        <div>
          <p className="text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum,
            quisquam. Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Voluptatum, quisquam. Lorem ipsum dolor sit amet consectetur
            adipisicing elit. Voluptatum, quisquam. Lorem ipsum dolor sit amet
            consectetur adipisicing elit. Voluptatum, quisquam. Lorem ipsum
            dolor sit amet consectetur adipisicing elit. Voluptatum, quisquam.
          </p>
        </div>
      </main>
    </>
  );
}
