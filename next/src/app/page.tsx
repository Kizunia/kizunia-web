
import { Vortex } from "@/components/ui/vortex";
export default function Home() {
  return (
    <div className="w-screen mx-auto rounded-md  h-screen overflow-hidden">
      <Vortex
        backgroundColor="black"
        className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
      >
        <h2 className="text-white text-2xl md:text-6xl font-bold text-center">
          KIZUNIA
        </h2>
        <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
          Building cool stuff
        </p>
        {/* <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          
          <p className="px-4 py-2 bg-blue-500 rounded-2xl text-white ">Coming Soon!</p>
        </div> */}
        <div   className=" mt-6 bg-slate-800 no-underline group  relative shadow-2xl shadow-zinc-900 rounded-full p-px text-md font-semibold leading-6  text-white inline-block">
          <span className="absolute inset-0 overflow-hidden rounded-full">
            <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </span>
          <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 ">
            <span className="px-1 py-1" >
              Cooking something!
            </span>
          </div>
          <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-blue/90 to-blue/0 transition-opacity duration-500 group-hover:opacity-40" />
        </div>

      </Vortex>
    </div>
  );
}
