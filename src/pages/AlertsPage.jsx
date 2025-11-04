import Layout from "../components/Layout";
import { useAlerts } from "../contexts/AlertContext";
import { format } from "date-fns";
import { Bell, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";

const AlertsPage = () => {
  const { alerts, acknowledgeAlert } = useAlerts();

  const handleAcknowledge = async (alertId) => {
    const result = await acknowledgeAlert(alertId);
    if (result.success) {
      // Alert acknowledged successfully
    }
  };

  const newAlerts = alerts.filter((a) => a.status === "new");
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-600 mt-1">
            Manage and respond to fire detection alerts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-1">Unacknowledged</p>
                <p className="text-4xl font-bold text-red-700">
                  {newAlerts.length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">Acknowledged</p>
                <p className="text-4xl font-bold text-green-700">
                  {acknowledgedAlerts.length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* New Alerts */}
        {newAlerts.length > 0 && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Unacknowledged Alerts ({newAlerts.length})
              </h2>
            </div>

            <div className="space-y-4">
              {newAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-red-50 border-2 border-red-300 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Bell className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-bold text-slate-900">
                          Fire Detected
                        </h3>
                        <span className="badge badge-danger">URGENT</span>
                      </div>

                      <div className="space-y-2 ml-8">
                        <div className="flex items-center space-x-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">
                            {alert.incident?.location_text ||
                              "Unknown Location"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-sm">
                            {format(new Date(alert.created_at), "PPpp")}
                          </span>
                        </div>

                        {alert.incident?.device && (
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">Device:</span>{" "}
                            {alert.incident.device.name}
                          </div>
                        )}

                        {alert.incident?.detection_method && (
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">
                              Detection Method:
                            </span>{" "}
                            {alert.incident.detection_method}
                          </div>
                        )}

                        {alert.incident?.sensor_snapshot && (
                          <div className="mt-3 p-3 bg-white rounded border border-red-200">
                            <p className="text-xs font-semibold text-slate-600 mb-2">
                              Sensor Readings:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(
                                alert.incident.sensor_snapshot
                              ).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-slate-600 capitalize">
                                    {key}:
                                  </span>{" "}
                                  <span className="font-semibold text-slate-900">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn btn-danger ml-4"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Acknowledged Alerts ({acknowledgedAlerts.length})
              </h2>
            </div>

            <div className="space-y-3">
              {acknowledgedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-slate-900">
                          {alert.incident?.location_text || "Unknown Location"}
                        </h3>
                        <span className="badge badge-success">
                          Acknowledged
                        </span>
                      </div>

                      <div className="space-y-1 ml-8 text-sm text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>
                            Detected:{" "}
                            {format(new Date(alert.created_at), "PPp")}
                          </span>
                        </div>
                        {alert.acknowledged_at && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>
                              Acknowledged:{" "}
                              {format(new Date(alert.acknowledged_at), "PPp")}
                            </span>
                          </div>
                        )}
                        {alert.acknowledged_by_user && (
                          <div className="text-sm">
                            <span className="font-medium">By:</span>{" "}
                            {alert.acknowledged_by_user.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="card text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No alerts to display</p>
            <p className="text-sm text-slate-400 mt-1">
              All systems are operational
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AlertsPage;
