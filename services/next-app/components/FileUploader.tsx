import { useState, useRef } from "react";

enum FileStatus {
  UPLOADING = "uploading",
  PENDING = "pending",
  FAILED = "failed",
  UPLOADED = "uploaded",
  TOO_LARGE = "too-large",
}

interface FileT {
  file: File;
  status: FileStatus;
}

export default function FileUploader() {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const inputRef = useRef<any>(null);
  const [files, setFiles] = useState<FileT[]>([]);

  const handleChange = (e: any) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      for (let i = 0; i < e.target.files["length"]; i++) {
        setFiles((prevState: FileT[]) => [
          ...prevState,
          {
            file: e.target.files[i] as File,
            status:
              e.target.files[i].size / (1024 * 1024) > 10 // 10mb limit
                ? FileStatus.TOO_LARGE
                : FileStatus.PENDING,
          },
        ]);
      }
    }
  };

  const handleSubmitFile = (e: any) => {
    if (files.length === 0) {
      // no file has been submitted
    } else {
      const uploadJobs = files.map((f) => {
        return new Promise<void>((resolve, reject) => {
          setFiles((prevState: FileT[]) =>
            prevState.map((v) =>
              v.file === f.file
                ? { file: v.file, status: FileStatus.UPLOADING }
                : v
            )
          );
          const data = new FormData();
          data.set("file", f.file);
          // Todo: set timeout for upload and fail if it takes too long
          fetch("/api/asset", { method: "POST", body: data })
            .then((r) => {
              setFiles((prevState: FileT[]) =>
                prevState.map((v) =>
                  v.file === f.file
                    ? { file: v.file, status: FileStatus.UPLOADED }
                    : v
                )
              );
              resolve();
            })
            .catch((e) => {
              setFiles((prevState: FileT[]) =>
                prevState.map((v) =>
                  v.file === f.file
                    ? { file: v.file, status: FileStatus.FAILED }
                    : v
                )
              );
              resolve();
            });
        });
      });
      Promise.all(uploadJobs).then(() => {
        setTimeout(() => {
          setFiles((prevState: FileT[]) =>
            prevState.filter((v) => v.status === FileStatus.FAILED)
          );
        }, 2500);
      });
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      for (let i = 0; i < e.dataTransfer.files["length"]; i++) {
        setFiles((prevState: FileT[]) => [
          ...prevState,
          { file: e.dataTransfer.files[i] as File, status: FileStatus.PENDING },
        ]);
      }
    }
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragEnter = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const removeFile = (idx: any) => {
    const newArr = [...files];
    newArr.splice(idx, 1);
    setFiles([]);
    setFiles(newArr);
  };

  const openFileExplorer = () => {
    inputRef.current.value = "";
    inputRef.current.click();
  };

  return (
    <>
      <div className="flex items-center justify-center h-full w-full">
        <form
          className={`${
            dragActive ? "bg-blue-400" : "bg-blue-100"
          }  p-4 w-full m-4 rounded-lg  text-center flex flex-col items-center justify-center`}
          onDragEnter={handleDragEnter}
          onSubmit={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          encType="multipart/form-data"
        >
          <input
            placeholder="fileInput"
            className="hidden"
            ref={inputRef}
            type="file"
            multiple={true}
            onChange={handleChange}
            accept="image/*"
          />
          <div className="flex items-center p-3 flex-wrap justify-between max-h-[30vh] overflow-y-scroll">
            <div
              key={-1}
              className="flex flex-row space-x-5 justify-center overflow-y-scroll p-3"
            >
              <div
                className="relative flex flex-col border border-gray-400 rounded-md justify-center align-middle items-center h-[10vh] max-h-[100px] aspect-square w-auto cursor-pointer"
                onClick={openFileExplorer}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
            </div>
            {files.map((f: FileT, idx: any) => (
              // TODO: This needs styling
              // TODO: display file size
              <div
                key={idx}
                className="flex flex-row space-x-5 justify-center overflow-y-scroll p-3"
              >
                <div
                  className="relative flex flex-col border border-gray-400 rounded-md justify-center align-middle items-center h-[10vh] max-h-[100px] aspect-square w-auto z-10 bg-center bg-contain bg-no-repeat"
                  style={{
                    backgroundImage: `url(${URL.createObjectURL(f.file)})`,
                  }}
                >
                  {f.status === FileStatus.TOO_LARGE ? (
                    <>
                      <div className="flex h-full w-full bg-white bg-opacity-75 justify-center items-center rounded-md">
                        <div className="grow bg-gray-400 text-white text-sm">
                          {"> 10mb"}
                        </div>
                      </div>

                      <span className="text-gray-600 absolute -top-3 -left-3 z-20 bg-blue-100 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      </span>
                    </>
                  ) : null}
                  {f.status === FileStatus.UPLOADING ? (
                    <svg
                      aria-hidden="true"
                      className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 absolute -top-3 -right-3 z-20 bg-blue-100 rounded-full"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  ) : f.status === FileStatus.UPLOADED ? (
                    <span className="text-green-600 absolute -top-3 -right-3 z-20 bg-blue-100 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span
                      className="text-red-500 cursor-pointer absolute -top-3 -right-3 z-20 bg-blue-100 rounded-full"
                      onClick={() => removeFile(idx)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-gray-600">
              Click or drag & drop files to upload
            </p>
            <button
              onClick={handleSubmitFile}
              className="bg-green-600 px-5 py-2 rounded-lg m-2"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
