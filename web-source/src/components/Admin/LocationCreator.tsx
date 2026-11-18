import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CarFront, Check, ClipboardCheck, MapPin, Sparkles, Tag, UserRound, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { AdminLocation } from '../../types';
import { Button, ConfirmDialog, IconButton } from '../ui';
import { createLocation } from './adminApi';
import { AgentSection, DetailsSection, EditorTab, SpawnSection } from './LocationEditor';
import { getLocationIssues } from './locationInfo';
import { LocationOverview } from './LocationOverview';
import { VehicleList } from './VehicleList';

type Step = Exclude<EditorTab, 'overview'> | 'review';

const STEPS: { id: Step; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Basics', description: 'Name the location and set up its map blip.', icon: Tag },
  { id: 'agent', label: 'Rental agent', description: 'Place the ped players talk to when renting.', icon: UserRound },
  { id: 'spawns', label: 'Spawn points', description: 'Mark where rented vehicles will appear.', icon: MapPin },
  { id: 'fleet', label: 'Fleet', description: 'Choose the vehicles and set their prices.', icon: CarFront },
  { id: 'review', label: 'Review', description: 'Check everything over, then create the location.', icon: ClipboardCheck },
];

interface LocationCreatorProps {
  saving: boolean;
  error: string | null;
  onCreate: (location: AdminLocation) => void;
  onCancel: () => void;
}

export const LocationCreator: React.FC<LocationCreatorProps> = ({ saving, error, onCreate, onCancel }) => {
  const [initial] = useState(createLocation);
  const [draft, setDraft] = useState(initial);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const step = STEPS[stepIndex];
  const issues = getLocationIssues(draft);
  const stepIssues = step.id === 'review' ? issues : issues.filter(issue => issue.tab === step.id);
  const isLast = stepIndex === STEPS.length - 1;

  const goTo = (index: number) => {
    setStepIndex(index);
    setFurthest(f => Math.max(f, index));
  };

  const cancel = () => {
    if (JSON.stringify(draft) === JSON.stringify(initial)) return onCancel();
    setConfirmCancel(true);
  };

  useEscapeKey(cancel);

  const renderStep = () => {
    switch (step.id) {
      case 'details':
        return <DetailsSection location={draft} onChange={setDraft} />;
      case 'agent':
        return <AgentSection location={draft} onChange={setDraft} />;
      case 'spawns':
        return <SpawnSection location={draft} onChange={setDraft} />;
      case 'fleet':
        return <VehicleList vehicles={draft.vehicles} onChange={vehicles => setDraft({ ...draft, vehicles })} />;
      case 'review':
        return <LocationOverview location={draft} onNavigate={tab => goTo(STEPS.findIndex(s => s.id === tab))} />;
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ink-900 animate-fade-in">
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-ink-925">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-400/20 flex items-center justify-center text-accent-300">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Create rental location</h1>
            <p className="text-[11px] text-ink-500">Step {stepIndex + 1} of {STEPS.length} · {step.label}</p>
          </div>
        </div>
        <IconButton icon={X} label="Cancel" onClick={cancel} />
      </header>

      <div className="h-0.5 bg-ink-800 shrink-0">
        <div className="h-full bg-accent-500 transition-all duration-300" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[260px_1fr]">
        <aside className="border-r border-white/[0.06] bg-ink-925 p-4 flex flex-col gap-1">
          {STEPS.map((s, i) => {
            const active = i === stepIndex;
            const reachable = i <= furthest;
            const complete = i < furthest && (s.id === 'review' || !issues.some(issue => issue.tab === s.id));
            return (
              <button
                key={s.id}
                disabled={!reachable}
                onClick={() => goTo(i)}
                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                  active ? 'bg-white/[0.06]' : reachable ? 'hover:bg-white/[0.03]' : ''
                }`}
              >
                <span className={`w-6 h-6 mt-0.5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold border ${
                  active
                    ? 'bg-accent-500 border-accent-400 text-white'
                    : complete
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                      : 'border-white/[0.1] text-ink-500'
                }`}>
                  {complete && !active ? <Check size={12} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-medium ${active ? 'text-white' : reachable ? 'text-ink-200' : 'text-ink-500'}`}>
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-ink-500 leading-snug mt-0.5">{s.description}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <main className="min-h-0 overflow-y-auto custom-scroll">
          <div className="max-w-[920px] mx-auto px-8 py-7">
            <div className="flex items-center gap-3 mb-5">
              <step.icon size={18} className="text-accent-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">{step.label}</h2>
                <p className="text-xs text-ink-500">{step.description}</p>
              </div>
            </div>
            {renderStep()}
          </div>
        </main>
      </div>

      <footer className="h-16 shrink-0 flex items-center justify-between gap-4 px-6 border-t border-white/[0.06] bg-ink-925">
        <p className={`text-xs truncate ${error ? 'text-red-300' : stepIssues.length ? 'text-amber-300' : 'text-ink-500'}`}>
          {error ?? (stepIssues.length ? stepIssues[0].text : isLast ? 'Everything looks good.' : 'This step is complete.')}
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
            Back
          </Button>
          {isLast ? (
            <Button icon={Check} onClick={() => onCreate(draft)} loading={saving} disabled={issues.length > 0}>
              Create location
            </Button>
          ) : (
            <Button onClick={() => goTo(stepIndex + 1)} disabled={stepIssues.length > 0}>
              Continue <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </footer>

      {confirmCancel && (
        <ConfirmDialog
          title="Discard this new location?"
          description="Everything you have set up so far will be lost."
          confirmLabel="Discard"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={onCancel}
        />
      )}
    </div>
  );
};
