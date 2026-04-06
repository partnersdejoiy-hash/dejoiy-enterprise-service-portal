"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

type RecordType = {
  id: string;
  verificationStatus: string;
  verificationNotes?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    name: string;
    email: string;
    employeeId?: string;
  };
  verificationCompany: string;
};

export default function BackgroundVerificationPage() {

  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string,string>>({});

  async function fetchRecords() {

    try{

      setLoading(true);

      const res = await fetch("/api/background-verification");
      const data = await res.json();

      if(res.ok){
        setRecords(data);
      }

    }catch(err){

      console.error("Failed to load records",err);

    }finally{

      setLoading(false);

    }

  }

  useEffect(()=>{
    fetchRecords();
  },[]);

  function handleNotesChange(id:string,value:string){

    setNotes(prev=>({
      ...prev,
      [id]:value
    }));

  }

  async function updateStatus(id:string,status:string){

    try{

      const res = await fetch("/api/background-verification",{
        method:"PATCH",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          id,
          verificationStatus:status,
          verificationNotes:notes[id] || null
        })
      });

      const data = await res.json();

      if(!res.ok){

        console.error("Update failed",data);
        alert(data.error || "Failed to update status");
        return;

      }

      setNotes(prev=>{
        const updated = {...prev};
        delete updated[id];
        return updated;
      });

      await fetchRecords();

    }catch(error){

      console.error("Update error",error);

    }

  }

  return(
    <AppShell>

      <div className="p-6">

        <h1 className="text-xl font-bold mb-6">
          Background Verification
        </h1>

        {loading && <p>Loading...</p>}

        {!loading && records.length === 0 && (
          <p>No background verification records found.</p>
        )}

        {records.map(record=>(
          <div
            key={record.id}
            className="border p-5 rounded-xl mb-4 bg-white shadow-sm"
          >

            <h3 className="font-semibold text-lg">
              {record.employee.name}
            </h3>

            <p className="text-sm text-gray-500">
              {record.employee.email}
              {record.employee.employeeId && ` • ${record.employee.employeeId}`}
            </p>

            <p className="mt-2">
              Company: {record.verificationCompany}
            </p>

            <p className="mt-1">
              Status: <strong>{record.verificationStatus}</strong>
            </p>

            {record.documentUrl && (
              <a
                href={record.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline block mt-2"
              >
                View Report
              </a>
            )}

            {record.verificationStatus !== "COMPLETED" && (
              <div className="mt-4">

                <textarea
                  placeholder="Add notes"
                  value={notes[record.id] || ""}
                  onChange={(e)=>handleNotesChange(record.id,e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />

                <div className="flex gap-3 mt-3">

                  <button
                    onClick={()=>updateStatus(record.id,"COMPLETED")}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Mark Clear
                  </button>

                  <button
                    onClick={()=>updateStatus(record.id,"REJECTED")}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Flag Issue
                  </button>

                  <button
                    onClick={()=>updateStatus(record.id,"IN_REVIEW")}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Under Review
                  </button>

                </div>

              </div>
            )}

            {record.verificationNotes && (
              <div className="mt-3 text-sm bg-gray-100 p-2 rounded">
                Notes: {record.verificationNotes}
              </div>
            )}

            <div className="text-xs text-gray-400 mt-3">
              Created: {new Date(record.createdAt).toLocaleString()}
            </div>

          </div>
        ))}

      </div>

    </AppShell>
  );
}