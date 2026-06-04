export const universities = [
  {
    name: 'Addis Ababa University',
    shortName: 'AAU',
    accent: 'from-blue-700 to-blue-500',
    logo: 'https://ethiopianlogos.com/logos/addis_ababa_university/addis_ababa_university.png',
  },
  {
    name: 'HiLCoE School of Computer Science and Technology',
    shortName: 'HiLCoE',
    accent: 'from-red-700 to-red-500',
    logo: 'https://hsis.hilcoe.edu.et/assets/icons/icon-32x32.png',
  },
  {
    name: "St. Mary's University",
    shortName: 'SMU',
    accent: 'from-rose-700 to-red-500',
    logo: 'https://smuc.edu.et/wp-content/uploads/2025/05/logo.png',
  },
  {
    name: 'Addis Ababa Science & Technology University',
    shortName: 'ASTU',
    accent: 'from-sky-700 to-cyan-500',
    logo: 'https://ethiopianlogos.com/logos/addis_ababa_science_and_technology_university/addis_ababa_science_and_technology_university.png',
  },
  {
    name: 'Adama Science and Technology University',
    shortName: 'Adama STU',
    accent: 'from-indigo-700 to-blue-500',
    logo: 'https://www.astu.edu.et/templates/astu/images/header.jpg',
  },
  {
    name: 'American College of Technology',
    shortName: 'ACT',
    accent: 'from-violet-700 to-indigo-500',
    logo: 'https://act.edu.et/assets/img/branding/logo.png',
  },
  {
    name: 'BITS College',
    shortName: 'BITS',
    accent: 'from-emerald-700 to-teal-500',
    logo: 'https://www.bitscollege.edu.et/wp-content/uploads/2022/08/output-onlinepngtools44.png',
  },
  {
    name: 'Unity University',
    shortName: 'Unity',
    accent: 'from-amber-600 to-orange-500',
    logo: '',
  },
  {
    name: 'Ethiopian Civil Service University',
    shortName: 'ECSU',
    accent: 'from-slate-700 to-slate-500',
    logo: '',
  },
  {
    name: 'Admas University',
    shortName: 'Admas',
    accent: 'from-lime-700 to-green-500',
    logo: '',
  },
]

export default function UniversityLogos() {
  const sliderItems = [...universities, ...universities]

  return (
    <section id="colleges" className="overflow-hidden border-y-4 border-[#06231f] bg-[#f2fbf3] shadow-sm">
      <div className="flex flex-col gap-1 border-b-2 border-[#06231f]/20 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Popular colleges</p>
          <h2 className="display-ink text-3xl font-black leading-none text-[#06231f]">Explore Addis institutions</h2>
        </div>
        <p className="max-w-xl text-sm font-medium leading-6 text-[#39564f]">
          Swipe through colleges students search most often, then jump straight into materials or teacher ratings.
        </p>
      </div>

      <div className="relative bg-[radial-gradient(circle_at_top_left,#cce8c8,transparent_36%),linear-gradient(180deg,#f2fbf3,#e8f5ef)] py-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#f2fbf3] to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f2fbf3] to-transparent sm:w-28" />
        <div className="college-slider flex w-max gap-4">
          {sliderItems.map((university, index) => (
            <a
              key={`${university.name}-${index}`}
              href="#search"
              className="group relative h-44 w-72 shrink-0 overflow-hidden border-2 border-[#06231f] bg-[#fffef1] p-5 shadow-[5px_5px_0_#06231f] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#06231f]"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${university.accent}`} />
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#06231f] bg-white text-sm font-black text-[#0d5b50]">
                  {university.logo ? (
                    <img
                      src={university.logo}
                      alt={`${university.name} logo`}
                      className="max-h-12 max-w-12 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    university.shortName
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black leading-snug text-[#06231f]">{university.name}</span>
                  <span className="mt-2 inline-flex rounded-full bg-[#e3f4df] px-2.5 py-1 text-xs font-black text-[#0d5b50]">
                    {university.shortName}
                  </span>
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t-2 border-[#06231f]/10 pt-4">
                <span className="text-xs font-bold text-[#49645d]">Materials & teacher ratings</span>
                <span className="text-sm font-black text-[#0d5b50]">Browse</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
