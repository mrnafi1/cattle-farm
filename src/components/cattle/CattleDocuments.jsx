import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";

export default function CattleDocuments({ cattleId, existingDocuments = [] }) {
  const { updateCattle, addToast } = useApp();
  const { language } = useLanguage();

  const [docName, setDocName] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // ফাইলকে Base64 স্ট্র্রিং-এ কনভার্ট করার ফাংশন
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // ফাইল সাইজ চেক (নিরাপত্তার জন্য সর্বোচ্চ ৫ MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      addToast(language === "bn" ? "ফাইল সাইজ ৫ MB এর কম হতে হবে!" : "File size must be less than 5MB!", "error");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !file) {
      addToast(language === "bn" ? "নাম এবং ফাইল দুটিই প্রয়োজন!" : "Name and file both are required!", "error");
      return;
    }

    setIsUploading(true);
    try {
      const base64File = await convertToBase64(file);
      
      const newDocument = {
        id: Date.now().toString(),
        name: docName.trim(),
        fileType: file.type.includes("pdf") ? "pdf" : "image",
        fileData: base64File,
        uploadedAt: new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")
      };

      // গরুর বিদ্যমান ডকুমেন্টের সাথে নতুনটি যুক্ত করা
      const updatedDocuments = [...existingDocuments, newDocument];
      
      if (updateCattle) {
        await updateCattle(cattleId, { documents: updatedDocuments });
        addToast(language === "bn" ? "ডকুমেন্ট সফলভাবে সংরক্ষিত হয়েছে!" : "Document uploaded successfully!", "success");
        // ফর্ম রিসেট
        setDocName("");
        setFile(null);
        e.target.reset();
      }
    } catch (error) {
      console.error(error);
      addToast(language === "bn" ? "আপলোড ব্যর্থ হয়েছে!" : "Upload failed!", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm(language === "bn" ? "এই ডকুমেন্টটি মুছে ফেলতে চান?" : "Delete this document?")) return;

    const updatedDocuments = existingDocuments.filter(doc => doc.id !== docId);
    if (updateCattle) {
      await updateCattle(cattleId, { documents: updatedDocuments });
      addToast(language === "bn" ? "ডকুমেন্ট মুছে ফেলা হয়েছে!" : "Document deleted!", "error");
    }
  };

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-[#E8E6DE] dark:border-slate-700/50">
      <div>
        <h4 className="text-base font-bold text-[#1A1A2E] dark:text-white transition-colors">📁 {language === "bn" ? "সংরক্ষিত কাগজপত্র ও ডকুমেন্ট" : "Preserved Documents"}</h4>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 transition-colors">
          {language === "bn" ? "ক্রয়ের রসিদ, মেডিকেল প্রেসক্রিপশন বা টিকার সার্টিফিকেট আপলোড করুন" : "Upload purchase receipts, prescriptions, or certificates"}
        </p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="bg-[#F5F4EF] dark:bg-slate-900/40 p-4 rounded-xl border border-[#E8E6DE] dark:border-slate-700/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end transition-colors">
        <div>
          <label className="text-[#64748B] dark:text-slate-400 text-xs font-semibold block mb-1 transition-colors">{language === "bn" ? "ডকুমেন্টের নাম" : "Document Name"}</label>
          <input
            type="text"
            placeholder={language === "bn" ? "যেমন: টিকার কার্ড" : "e.g. Vaccine Card"}
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-slate-800 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
          />
        </div>
        <div>
          <label className="text-[#64748B] dark:text-slate-400 text-xs font-semibold block mb-1 transition-colors">{language === "bn" ? "ফাইল নির্বাচন (PDF/Image)" : "Select File (PDF/Image)"}</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="w-full text-xs text-[#64748B] dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E8E6DE] file:text-[#1A1A2E] hover:file:bg-[#94A3B8] file:transition-colors cursor-pointer"
          />
        </div>
        <Button type="submit" disabled={isUploading || !file || !docName.trim()} className="w-full flex items-center justify-center gap-1.5">
          {isUploading ? "..." : `📤 ${language === "bn" ? "আপলোড করুন" : "Upload"}`}
        </Button>
      </form>

      {/* Document List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {existingDocuments.map((doc) => (
          <div key={doc.id} className="bg-[#FFFFFF] dark:bg-slate-800/50 border border-[#E8E6DE] dark:border-slate-700/50 rounded-xl p-3 flex items-center justify-between shadow-sm transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#F5F4EF] dark:bg-slate-700 flex items-center justify-center text-xl transition-colors">
                {doc.fileType === "pdf" ? "📄" : "🖼️"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white truncate transition-colors">{doc.name}</p>
                <p className="text-[11px] text-[#94A3B8] dark:text-slate-500 mt-0.5 transition-colors">{doc.uploadedAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* ডাউনলোড বা ভিউ বাটন */}
              <a
                href={doc.fileData}
                download={doc.name}
                title={language === "bn" ? "ডাউনলোড করুন" : "Download"}
                className="p-2 text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition-colors text-sm"
              >
                📥
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                title={language === "bn" ? "মুছে ফেলুন" : "Delete"}
                className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {existingDocuments.length === 0 && (
          <div className="col-span-full py-6 text-center text-[#94A3B8] dark:text-slate-500 text-sm border-2 border-dashed border-[#E8E6DE] dark:border-slate-700/40 rounded-xl transition-colors">
            📭 {language === "bn" ? "কোনো ডকুমেন্ট আপলোড করা হয়নি" : "No documents uploaded yet"}
          </div>
        )}
      </div>
    </div>
  );
}