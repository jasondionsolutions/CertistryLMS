// app/(admin)/admin/questions/create-task/page.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for PostgreSQL)

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Check, Target, Users, Calendar, TrendingUp } from 'lucide-react';
import { listCertifications } from "@/modules/certifications/serverActions/certification.action";
import { useQuestionManagement } from '@/modules/admin/questions/hooks/useQuestionManagement';
import type { Certification, CertificationDomain, CertificationObjective } from '@prisma/client';
import { toast } from 'sonner';
import { AdminAuthWrapper } from "@/modules/admin/shared/ui";
import { ErrorBoundary } from "@/modules/shared/ui/error-boundary";
import { logger } from "@/lib/utils/secure-logger";

type CertificationWithDomains = Certification & {
  domains: (CertificationDomain & { objectives: CertificationObjective[] })[];
};

interface WizardStep1Data {
  certificationId: string;
  certificationName: string;
  certificationCode: string;
}

interface WizardStep2Data extends WizardStep1Data {
  selectedVersion: string;
}

interface WizardStep3Data extends WizardStep2Data {
  targetTotal: number;
  countExisting: boolean;
  objectives: {
    domainName: string;
    objectiveCode: string;
    objectiveName: string;
    domainWeight: number;
    autoCount: number;
    targetCount: number;
  }[];
}

interface WizardStep4Data extends WizardStep3Data {
  taskName: string;
}

interface DistributionItem {
  domainName: string;
  objectiveCode: string;
  objectiveName: string;
  domainWeight: number;
  autoCount: number;
  targetCount: number;
  existingCount: number;
}

function QuestionCreationWizardPageContent() {
  const router = useRouter();
  const { calculateDistribution, createTask, loading: hookLoading } = useQuestionManagement();
  const [currentStep, setCurrentStep] = useState(1);
  const [certificationsLoading, setCertificationsLoading] = useState(true);
  const [certifications, setCertifications] = useState<CertificationWithDomains[]>([]);

  // Wizard data
  const [step1Data, setStep1Data] = useState<WizardStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<WizardStep2Data | null>(null);
  const [step3Data, setStep3Data] = useState<WizardStep3Data | null>(null);
  const [step4Data, setStep4Data] = useState<WizardStep4Data | null>(null);

  // Step 3 specific state
  const [targetTotal, setTargetTotal] = useState(100);
  const [countExisting, setCountExisting] = useState(true);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [distributionLoading, setDistributionLoading] = useState(false);

  useEffect(() => {
    loadCertificationsData();
  }, []);

  const loadCertificationsData = async () => {
    try {
      setCertificationsLoading(true);
      const result = await listCertifications();

      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logger.error('Invalid certifications data format', null, { component: 'AdminQuestionsCreate', action: 'loadCertifications' });
        setCertifications([]);
        return;
      }

      // Type cast to CertificationWithDomains (domains are included from listCertifications)
      setCertifications(result.data as unknown as CertificationWithDomains[]);
    } catch (error) {
      logger.error('Failed to load certifications', error, { component: 'AdminQuestionsCreate', action: 'loadCertifications' });
      toast.error('Failed to load certifications');
      setCertifications([]);
    } finally {
      setCertificationsLoading(false);
    }
  };

  const handleStep1Next = (certData: WizardStep1Data) => {
    setStep1Data(certData);
    setCurrentStep(2);
  };

  const handleStep2Next = (versionData: WizardStep2Data) => {
    setStep2Data(versionData);
    setCurrentStep(3);
    loadDistribution(versionData.certificationId, targetTotal, countExisting);
  };

  const handleStep3Next = async (distributionData: WizardStep3Data) => {
    setStep3Data(distributionData);
    setCurrentStep(4);
  };

  const loadDistribution = async (certificationId: string, total: number, includeExisting: boolean) => {
    setDistributionLoading(true);
    try {
      const result = await calculateDistribution(certificationId);

      if (!result.success || !result.data) {
        logger.error('Invalid distribution response', null, { component: 'AdminQuestionsCreate', action: 'calculateDistribution' });
        setDistribution([]);
        return;
      }

      const cert = getCertificationById(certificationId);
      if (!cert) {
        logger.error('Certification not found', null, { certificationId });
        setDistribution([]);
        return;
      }

      const distributionItems: DistributionItem[] = [];

      // Calculate total objectives per domain for even distribution
      const domainObjectiveCounts: Record<string, number> = {};
      for (const domain of cert.domains) {
        domainObjectiveCounts[domain.name] = domain.objectives.length;
      }

      // Build distribution items from objectives
      for (const domain of cert.domains) {
        const domainWeight = domain.weight;
        const domainTotal = Math.round((total * domainWeight));
        const objectivesInDomain = domain.objectives.length || 1;

        for (const objective of domain.objectives) {
          const autoCount = Math.round(domainTotal / objectivesInDomain);
          const existingCount = result.data.objectiveDistribution[objective.code]?.existing || 0;

          distributionItems.push({
            domainName: domain.name,
            objectiveCode: objective.code,
            objectiveName: objective.description,
            domainWeight: Math.round(domainWeight * 100), // Convert to percentage
            autoCount,
            targetCount: autoCount,
            existingCount
          });
        }
      }

      setDistribution(distributionItems);
    } catch (error) {
      logger.error('Failed to calculate distribution', error, { component: 'AdminQuestionsCreate', certificationId });
      toast.error('Failed to calculate question distribution');
      setDistribution([]);
    } finally {
      setDistributionLoading(false);
    }
  };

  const handleCreateTask = async (taskData: WizardStep4Data) => {
    if (!step1Data || !step3Data) {
      toast.error('Missing required data. Please restart the wizard.');
      return;
    }

    try {
      // Convert objectives array to Record<string, number> format
      const objectivesRecord: Record<string, number> = {};
      step3Data.objectives.forEach(obj => {
        objectivesRecord[obj.objectiveCode] = obj.targetCount;
      });

      const result = await createTask({
        name: taskData.taskName,
        certificationId: step1Data.certificationId,
        targetTotal: step3Data.targetTotal,
        countExisting: step3Data.countExisting,
        objectives: objectivesRecord,
      });

      if (result.success) {
        router.push('/admin/questions');
      }
    } catch (error) {
      logger.error('Failed to create question task', error, { component: 'AdminQuestionsCreate', taskName: taskData.taskName });
    }
  };

  const updateDistributionTarget = (index: number, newTarget: string) => {
    const updated = [...distribution];
    if (newTarget.trim() === '' || /^\d+$/.test(newTarget.trim())) {
      updated[index].targetCount = newTarget.trim() === '' ? 0 : Math.max(0, parseInt(newTarget));
      setDistribution(updated);
    }
  };

  const getTotalDistributed = () => {
    return distribution.reduce((sum, obj) => sum + obj.targetCount, 0);
  };

  const handleCancel = () => {
    router.push('/admin/questions');
  };

  const getCertificationById = (certificationId: string) => {
    return certifications.find(cert => cert.id === certificationId);
  };

  const getDomainCount = (certificationId: string) => {
    const cert = getCertificationById(certificationId);
    return cert?.domains?.length || 0;
  };

  const getObjectiveCount = (certificationId: string) => {
    const cert = getCertificationById(certificationId);
    return cert?.domains?.reduce((acc, d) => acc + (d.objectives?.length || 0), 0) || 0;
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Return to Questions
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <Target className="w-8 h-8 mr-3 text-indigo-600" />
              Question Creation Wizard
            </h1>
            <p className="text-muted-foreground mt-2 text-xl">
              Create systematic question sets with progress tracking
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Step {currentStep} of 4
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b bg-muted/30 py-6">
        <div className="flex items-center justify-center gap-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step < currentStep ? 'bg-green-500 text-white' :
                step === currentStep ? 'bg-primary text-white' :
                'bg-muted text-muted-foreground border-2 border-muted-foreground'
              }`}>
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
              <div className="text-center">
                <div className={`font-medium ${step === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step === 1 && 'Select Certification'}
                  {step === 2 && 'Confirm Details'}
                  {step === 3 && 'Distribution'}
                  {step === 4 && 'Create Task'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {step === 1 && 'Choose certification'}
                  {step === 2 && 'Verify details'}
                  {step === 3 && 'Configure questions'}
                  {step === 4 && 'Review & create'}
                </div>
              </div>
              {step < 4 && <ArrowRight className="w-5 h-5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {/* Step 1: Select Certification */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Select a Certification</h2>
              <p className="text-lg text-muted-foreground">Choose the certification you want to create questions for.</p>
            </div>

            {certificationsLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-lg text-muted-foreground">Loading certifications...</p>
              </div>
            ) : certifications.length === 0 ? (
              <div className="text-center py-16">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Certifications Available</h3>
                <p className="text-muted-foreground mb-6">
                  No certifications found. Please create a certification first.
                </p>
                <Button onClick={() => router.push('/admin/certifications')}>
                  Go to Certifications
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certifications.map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => handleStep1Next({
                      certificationId: cert.id,
                      certificationName: cert.name,
                      certificationCode: cert.code,
                    })}
                    className="group p-6 border rounded-xl text-left hover:border-primary hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Target className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{cert.name}</h3>
                        <p className="text-muted-foreground mb-3">{cert.code}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{cert.domains?.length || 0} domains</span>
                          <span>{getObjectiveCount(cert.id)} objectives</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Confirm Details */}
        {currentStep === 2 && step1Data && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Confirm Certification Details</h2>
              <p className="text-lg text-muted-foreground">Verify the certification details before proceeding.</p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-blue/5 border border-primary/20 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Target className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{step1Data.certificationName}</h3>
                  <p className="text-lg text-muted-foreground mb-6">{step1Data.certificationCode}</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {getDomainCount(step1Data.certificationId)}
                      </div>
                      <div className="text-sm text-muted-foreground">Domains</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {getObjectiveCount(step1Data.certificationId)}
                      </div>
                      <div className="text-sm text-muted-foreground">Objectives</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button size="lg" onClick={() => handleStep2Next({
                ...step1Data,
                selectedVersion: step1Data.certificationCode
              })}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Question Distribution */}
        {currentStep === 3 && step2Data && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Question Distribution</h2>
              <p className="text-lg text-muted-foreground">Configure how questions will be distributed across domains and objectives.</p>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium">Target Total Questions</label>
                <Input
                  type="text"
                  value={targetTotal === 0 ? '' : targetTotal}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === '' || /^\d+$/.test(value)) {
                      const newTotal = value === '' ? 0 : parseInt(value);
                      setTargetTotal(newTotal);
                      if (step2Data && newTotal > 0) {
                        loadDistribution(step2Data.certificationId, newTotal, countExisting);
                      }
                    }
                  }}
                  placeholder="Enter total questions"
                  className="text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Total number of questions for this certification
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">Count Existing Questions</label>
                <select
                  value={countExisting ? 'true' : 'false'}
                  onChange={(e) => {
                    const newCountExisting = e.target.value === 'true';
                    setCountExisting(newCountExisting);
                    if (step2Data) {
                      loadDistribution(step2Data.certificationId, targetTotal, newCountExisting);
                    }
                  }}
                  className="w-full border rounded-md px-4 py-3 bg-background text-lg h-12"
                >
                  <option value="true">Include existing questions in count</option>
                  <option value="false">Only count new questions created</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  How to handle questions already in the database
                </p>
              </div>
            </div>

            {/* Distribution Table */}
            {distributionLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-lg text-muted-foreground">Calculating distribution...</p>
              </div>
            ) : distribution.length > 0 ? (
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Question Distribution</h3>
                    <span className="text-lg">
                      Total: <span className="font-bold text-primary">{getTotalDistributed()}</span> questions
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-4 font-semibold">Domain</th>
                        <th className="text-left p-4 font-semibold">Objective</th>
                        <th className="text-center p-4 font-semibold">Domain Weight</th>
                        <th className="text-center p-4 font-semibold">Auto Count</th>
                        <th className="text-center p-4 font-semibold">Existing</th>
                        <th className="text-center p-4 font-semibold">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution.map((obj, index) => (
                        <tr key={obj.objectiveCode} className="border-t hover:bg-muted/20">
                          <td className="p-4">
                            <div className="font-semibold">{obj.domainName}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold">{obj.objectiveCode}</div>
                            <div className="text-sm text-muted-foreground">{obj.objectiveName}</div>
                          </td>
                          <td className="text-center p-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {obj.domainWeight}%
                            </span>
                          </td>
                          <td className="text-center p-4 font-semibold">{obj.autoCount}</td>
                          <td className="text-center p-4 text-muted-foreground">{obj.existingCount || 0}</td>
                          <td className="text-center p-4">
                            <Input
                              type="text"
                              value={obj.targetCount === 0 ? '' : obj.targetCount}
                              onChange={(e) => updateDistributionTarget(index, e.target.value)}
                              className="w-24 text-center mx-auto"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Distribution Available</h3>
                <p className="text-muted-foreground">
                  Unable to calculate question distribution. Please check the certification configuration.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={() => handleStep3Next({
                  ...step2Data,
                  targetTotal,
                  countExisting,
                  objectives: distribution.map(obj => ({
                    domainName: obj.domainName,
                    objectiveCode: obj.objectiveCode,
                    objectiveName: obj.objectiveName,
                    domainWeight: obj.domainWeight,
                    autoCount: obj.autoCount,
                    targetCount: obj.targetCount,
                  })),
                })}
                disabled={distribution.length === 0}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Create Task */}
        {currentStep === 4 && step3Data && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Create Question Task</h2>
              <p className="text-lg text-muted-foreground">Give your task a name and review the final configuration.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-3">Task Name</label>
                <Input
                  placeholder={`${step1Data?.certificationName || 'Certification'} - ${step3Data?.targetTotal || 0} Questions`}
                  onChange={(e) => setStep4Data({ ...step3Data, taskName: e.target.value })}
                  className="text-lg h-14"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-primary/5 to-blue/5 border border-primary/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Task Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Certification</div>
                    <div className="font-semibold text-lg">{step1Data?.certificationName || 'Unknown'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                    <div className="font-semibold text-2xl text-green-600">{step3Data.targetTotal}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Objectives</div>
                    <div className="font-semibold text-lg">{step3Data.objectives.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Count Existing</div>
                    <div className="font-semibold text-lg">{step3Data.countExisting ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <Button variant="outline" size="lg" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={() => handleCreateTask(step4Data || {
                  ...step3Data,
                  taskName: `${step1Data?.certificationName || 'Certification'} - ${step3Data?.targetTotal || 0} Questions`
                })}
                disabled={hookLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8"
              >
                {hookLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function QuestionCreationWizardPage() {
  return (
    <AdminAuthWrapper>
      <ErrorBoundary level="page">
        <QuestionCreationWizardPageContent />
      </ErrorBoundary>
    </AdminAuthWrapper>
  );
}
