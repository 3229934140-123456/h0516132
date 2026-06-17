import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { ToastProvider } from "@/components/ui/Toast";
import Dashboard from "@/pages/Dashboard";
import ContractList from "@/pages/ContractList";
import ContractForm from "@/pages/ContractForm";
import ContractDetail from "@/pages/ContractDetail";
import ContractConfirm from "@/pages/ContractConfirm";
import ProjectList from "@/pages/ProjectList";
import ProjectDetail from "@/pages/ProjectDetail";
import ClientList from "@/pages/ClientList";
import ClientDetail from "@/pages/ClientDetail";
import PaymentTracker from "@/pages/PaymentTracker";
import Statistics from "@/pages/Statistics";

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/contracts/confirm/:token" element={<ContractConfirm />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/:id/edit" element={<ContractForm />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/payments" element={<PaymentTracker />} />
            <Route path="/statistics" element={<Statistics />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}
