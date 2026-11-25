'use client';

import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import OrderingAsRow from '@/components/person/OrderingAsRow';
import PersonNameDialog from '@/components/person/PersonNameDialog';
import { Button } from '@/components/ui';
import { usePerson } from '@/providers/person';
import { fontFamilies } from '@/theme';

interface DialogState {
  open: boolean;
  mode: 'first-send' | 'change';
}

const SIMULATED_SEND_MS = 1100;
const TOTAL_LABEL = 'R$ 53,80';

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  blockSize: '100%',
  overflowY: 'auto',
  padding: 24,
  fontFamily: fontFamilies.text,
  backgroundColor: theme.vars.palette.surface.page,
  color: theme.vars.palette.surface.ink,
}));

const Section = styled('section')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
});

const Heading = styled('h2')({
  margin: 0,
  fontSize: 16,
});

const Log = styled('ol')({
  margin: 0,
  paddingInlineStart: 20,
  fontSize: 13,
});

function describePerson(person: string | null | undefined): string {
  if (person === undefined) {
    return 'ainda não lido';
  }

  return person ?? 'sem nome salvo';
}

const PersonSandbox: React.FC = () => {
  const { person, needsPerson, setPerson } = usePerson();
  const [dialog, setDialog] = useState<DialogState>({ open: false, mode: 'first-send' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  function record(entry: string): void {
    setLog(current => [...current, entry]);
  }

  function closeDialog(): void {
    setDialog(current => ({ ...current, open: false }));
  }

  function handleConfirm(name: string): void {
    record(`onConfirm("${name}")`);

    if (dialog.mode === 'change') {
      setPerson(name);
      closeDialog();
      return;
    }

    setIsSubmitting(true);
    timer.current = setTimeout(() => {
      setPerson(name);
      setIsSubmitting(false);
      closeDialog();
    }, SIMULATED_SEND_MS);
  }

  return (
    <Root>
      <Section>
        <Heading>nome desta movimentação</Heading>
        <span>{describePerson(person)}</span>
        <span>needsPerson: {String(needsPerson)}</span>
        {person && <OrderingAsRow name={person} onChange={() => setDialog({ open: true, mode: 'change' })} />}
      </Section>
      <Section>
        <Heading>primeiro envio</Heading>
        <Button onClick={() => setDialog({ open: true, mode: 'first-send' })}>simular primeiro envio</Button>
      </Section>
      <Section>
        <Heading>chamadas de onConfirm</Heading>
        <Log>
          {log.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </Log>
      </Section>
      <PersonNameDialog
        open={dialog.open}
        {...(dialog.mode === 'first-send'
          ? { mode: 'first-send' as const, totalLabel: TOTAL_LABEL }
          : { mode: 'change' as const })}
        initialName={dialog.mode === 'change' ? (person ?? null) : null}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirm}
        onClose={closeDialog}
      />
    </Root>
  );
};

export default PersonSandbox;
