"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ShieldCheck, Send } from "lucide-react";

type EmploymentVerification = {
  id: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  requestEmail: string;
  verificationPurpose: string;
  status: string;
  hrNotes?: string | null;
  createdAt: string;
};

type MeResponse = {
  id: string;
  name: string;
  email: string;
};

function StatusBadge({ value }: { value: string }) {

  const styles: Record<string,string> = {
    PENDING:"bg-amber-100 text-amber-700",
    APPROVED:"bg-blue-100 text-blue-700",
    REJECTED:"bg-red-100 text-red-700",
    COMPLETED:"bg-emerald-100 text-emerald-700"
  };

  return(
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );

}

export default function EmploymentVerificationPage(){

  const [records,setRecords] = useState<EmploymentVerification[]>([]);
  const [loading,setLoading] = useState(true);
  const [submitting,setSubmitting] = useState(false);

  const [employeeId,setEmployeeId] = useState("");
  const [employeeName,setEmployeeName] = useState("");

  const [companyName,setCompanyName] = useState("");
  const [requestEmail,setRequestEmail] = useState("");
  const [verificationPurpose,setVerificationPurpose] = useState("");

  const [statusFilter,setStatusFilter] = useState("");

  const [notes,setNotes] = useState<Record<string,string>>({});

  async function bootstrapUser(){

    const res = await fetch("/api/auth/me");
    const data:MeResponse = await res.json();

    if(res.ok){
      setEmployeeId(data.id);
      setEmployeeName(data.name);
    }

  }

  async function fetchRecords(status?:string){

    setLoading(true);

    const url =
      status && status.length > 0
        ? `/api/employment-verification?status=${status}`
        : "/api/employment-verification";

    const res = await fetch(url);
    const data = await res.json();

    if(res.ok){
      setRecords(data);
    }

    setLoading(false);

  }

  useEffect(()=>{
    bootstrapUser();
    fetchRecords();
  },[]);

  async function handleSubmit(e:React.FormEvent<HTMLFormElement>){

    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/employment-verification",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        employeeId,
        employeeName,
        companyName,
        requestEmail,
        verificationPurpose
      })
    });

    if(res.ok){

      setCompanyName("");
      setRequestEmail("");
      setVerificationPurpose("");

      fetchRecords();

    }

    setSubmitting(false);

  }

  function handleNotesChange(id:string,value:string){

    setNotes(prev=>({
      ...prev,
      [id]:value
    }));

  }

  async function updateStatus(id:string,status:string){

    try{

      const res = await fetch("/api/employment-verification",{
        method:"PATCH",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          verificationId:id,
          data:{
            status,
            hrNotes:notes[id] || null
          }
        })
      });

      const data = await res.json();

      if(!res.ok){

        console.error(data);
        alert(data.error || "Failed to update status");
        return;

      }

      setNotes(prev=>{
        const updated = {...prev};
        delete updated[id];
        return updated;
      });

      await fetchRecords(statusFilter);

    }catch(error){

      console.error("Update error:",error);

    }

  }

  return(
    <AppShell>

      <div className="grid gap-6 xl:grid-cols-3">

        {/* LEFT FORM */}

        <div className="xl:col-span-1">
          <div className="rounded-3xl border p-6 bg-white">

            <div className="flex items-center gap-3">
              <Send className="h-5 w-5"/>
              <h1 className="text-lg font-semibold">
                New Verification Request
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">

              <input
                value={employeeName}
                onChange={(e)=>setEmployeeName(e.target.value)}
                placeholder="Employee Name"
                className="w-full border rounded-xl px-4 py-2"
              />

              <input
                value={companyName}
                onChange={(e)=>setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full border rounded-xl px-4 py-2"
                required
              />

              <input
                type="email"
                value={requestEmail}
                onChange={(e)=>setRequestEmail(e.target.value)}
                placeholder="verification@company.com"
                className="w-full border rounded-xl px-4 py-2"
                required
              />

              <textarea
                value={verificationPurpose}
                onChange={(e)=>setVerificationPurpose(e.target.value)}
                placeholder="Verification purpose"
                className="w-full border rounded-xl px-4 py-2"
              />

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-xl"
              >
                {submitting ? "Submitting..." : "Submit Verification"}
              </button>

            </form>

          </div>
        </div>

        {/* RIGHT LIST */}

        <div className="xl:col-span-2">

          <div className="rounded-3xl border p-6 bg-white">

            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-5 w-5"/>
              <h2 className="text-lg font-semibold">
                Employment Verification Requests
              </h2>
            </div>

            {loading && <p>Loading...</p>}

            {records.map(record=>(
              <div key={record.id} className="border rounded-xl p-4 mb-4">

                <h3 className="font-semibold">
                  {record.companyName}
                </h3>

                <p className="text-sm text-gray-600">
                  {record.verificationPurpose}
                </p>

                <div className="mt-2">
                  <StatusBadge value={record.status}/>
                </div>

                <p className="text-sm mt-2">
                  Employee: {record.employeeName}
                </p>

                <p className="text-sm">
                  Email: {record.requestEmail}
                </p>

                {record.status === "PENDING" && (

                  <div className="mt-3 space-y-2">

                    <textarea
                      placeholder="HR Notes"
                      value={notes[record.id] || ""}
                      onChange={(e)=>handleNotesChange(record.id,e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />

                    <div className="flex gap-3">

                      <button
                        onClick={()=>updateStatus(record.id,"APPROVED")}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        Approve
                      </button>

                      <button
                        onClick={()=>updateStatus(record.id,"REJECTED")}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Reject
                      </button>

                    </div>

                  </div>

                )}

                {record.hrNotes && (
                  <div className="mt-3 text-sm bg-gray-100 p-2 rounded">
                    HR Notes: {record.hrNotes}
                  </div>
                )}

              </div>
            ))}

          </div>

        </div>

      </div>

    </AppShell>
  );
}