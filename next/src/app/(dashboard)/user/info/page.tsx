import { getServerSession } from "@/lib/get-session";

export default async function Page() {

  const session = await getServerSession();

  if (!session) {
    return <div>No session found.</div>;
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 border ">
        <h2 className="text-xl font-semibold mb-2">User Info</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[300px] max-w-full table-auto border  rounded">
            <tbody>
              {Object.entries(session).map(([key, value]) => (
                <tr key={key} className="border-b">
                  <td className="px-3 py-2 font-medium light:text-gray-700  dark:text-white whitespace-nowrap">
                    {key}
                  </td>
                  <td className="px-3 py-2 light:text-gray-700  dark:text-white break-all">
                    {typeof value === "object" && value !== null ? (
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
