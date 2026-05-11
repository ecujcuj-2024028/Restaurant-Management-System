import { useEffect } from "react";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  UserCircle2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useUserStore from "../store/userStore";

// Badge de estado de la solicitud
const StatusBadge = ({ status }) => {
  const map = {
    PENDING: {
      label: "Pendiente",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    },
    APPROVED: {
      label: "Aprobada",
      className: "bg-green-500/10  text-green-400  border-green-500/20",
    },
    REJECTED: {
      label: "Rechazada",
      className: "bg-red-500/10    text-red-400    border-red-500/20",
    },
  };
  const { label, className } = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      <Clock size={10} />
      {label}
    </span>
  );
};

const RoleRequestList = () => {
  const {
    roleRequests,
    roleRequestsLoading,
    roleRequestsError,
    fetchRoleRequests,
    approveRequest,
    rejectRequest,
  } = useUserStore();

  useEffect(() => {
    fetchRoleRequests();
  }, []);

  const handleApprove = async (id) => {
    const toastId = toast.loading("Aprobando solicitud...");
    try {
      await approveRequest(id);
      toast.success("Solicitud aprobada correctamente", { id: toastId });
    } catch {
      toast.error("Error al aprobar la solicitud", { id: toastId });
    }
  };

  const handleReject = async (id) => {
    const toastId = toast.loading("Rechazando solicitud...");
    try {
      await rejectRequest(id);
      toast.success("Solicitud rechazada", { id: toastId });
    } catch {
      toast.error("Error al rechazar la solicitud", { id: toastId });
    }
  };

  // ── Estados de carga / error ────────────────────────────────────────────────
  if (roleRequestsLoading && !roleRequests.length) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (roleRequestsError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-3xl text-center">
        <p>Error al cargar las solicitudes: {roleRequestsError}</p>
        <button
          onClick={fetchRoleRequests}
          className="mt-4 text-sm font-bold underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Vista principal ─────────────────────────────────────────────────────────
  return (
    <section>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">
            Solicitudes de Cambio de Rol
          </h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            {roleRequests.length === 0
              ? "Sin solicitudes pendientes"
              : `${roleRequests.filter((r) => r.status === "PENDING").length} pendiente(s) de revisión`}
          </p>
        </div>
        <button
          onClick={fetchRoleRequests}
          disabled={roleRequestsLoading}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={roleRequestsLoading ? "animate-spin" : ""}
          />
          Actualizar
        </button>
      </div>

      {/* Lista vacía */}
      {roleRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <Inbox size={48} className="mb-4 opacity-40" />
          <p className="text-sm font-medium">
            No hay solicitudes de cambio de rol
          </p>
        </div>
      )}

      {/* Tarjetas */}
      <div className="space-y-3">
        {roleRequests.map((req) => (
          <div
            key={req.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-zinc-700 transition-colors"
          >
            {/* Info del usuario */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500 shrink-0">
                <UserCircle2 size={22} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  {req.User?.Username ?? req.UserId}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {req.User?.Email}
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                  Solicita rol:{" "}
                  <span className="text-orange-400 font-bold">
                    {req.RequestedRole}
                  </span>
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={req.Status} />

              {req.Status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleApprove(req.Id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                  >
                    <ShieldCheck size={14} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(req.Id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  >
                    <ShieldX size={14} />
                    Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RoleRequestList;
