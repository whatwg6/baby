import { type FormEvent, useMemo, useRef, useState } from "react";
import { recordMeta, recordTypeOrder } from "../../domain/recordMeta";
import type { RecordDraft, RecordType, SleepPayload } from "../../domain/types";

export type RecordComposerProps = {
  childId: string;
  initialType?: RecordType;
  onCancel: () => void;
  onSave: (draft: RecordDraft) => void | Promise<void>;
};

const temporaryPhotoMediaId = "manual-photo-entry";

function pad(value: number): string {
  return `${value}`.padStart(2, "0");
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function numberToUndefined(value: string): number | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function combineDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

function parseDateTimeInput(date: string, time: string): number | undefined {
  if (!date || !time) {
    return undefined;
  }

  const timestamp = Date.parse(combineDateTime(date, time));

  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function fieldClassName() {
  return "mt-1 w-full rounded-card border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
}

function labelClassName() {
  return "text-sm font-medium text-ink";
}

export function RecordComposer({ childId, initialType = "journal", onCancel, onSave }: RecordComposerProps) {
  const now = useMemo(() => new Date(), []);
  const sleepEnd = useMemo(() => addMinutes(now, 60), [now]);
  const [type, setType] = useState<RecordType>(initialType);
  const [date, setDate] = useState(toDateInputValue(now));
  const [time, setTime] = useState(toTimeInputValue(now));
  const [note, setNote] = useState("");
  const [journalBody, setJournalBody] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState("");
  const [sleepStartDate, setSleepStartDate] = useState(toDateInputValue(now));
  const [sleepStartTime, setSleepStartTime] = useState(toTimeInputValue(now));
  const [sleepEndDate, setSleepEndDate] = useState(toDateInputValue(sleepEnd));
  const [sleepEndTime, setSleepEndTime] = useState(toTimeInputValue(sleepEnd));
  const [sleepQuality, setSleepQuality] = useState<SleepPayload["quality"]>("normal");
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDose, setVaccineDose] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [vaccineLocation, setVaccineLocation] = useState("");
  const [milestoneCategory, setMilestoneCategory] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const errorId = error ? "record-composer-error" : undefined;

  function buildDraft(): RecordDraft | null {
    const occurredAt = combineDateTime(date, time);
    const common = {
      childId,
      occurredAt,
      note: trimToUndefined(note),
    };

    switch (type) {
      case "journal": {
        const body = journalBody.trim();
        if (!body) {
          setError("请输入日记内容");
          return null;
        }

        return {
          ...common,
          type,
          title: body.split(/\s+/)[0]?.slice(0, 24),
          payload: { body },
        };
      }
      case "photo": {
        const caption = trimToUndefined(photoCaption);

        return {
          ...common,
          type,
          title: caption,
          mediaIds: [temporaryPhotoMediaId],
          payload: {
            caption,
            mediaId: temporaryPhotoMediaId,
          },
        };
      }
      case "growth": {
        const payload = {
          heightCm: numberToUndefined(heightCm),
          weightKg: numberToUndefined(weightKg),
          headCircumferenceCm: numberToUndefined(headCircumferenceCm),
        };

        if (
          payload.heightCm === undefined &&
          payload.weightKg === undefined &&
          payload.headCircumferenceCm === undefined
        ) {
          setError("请至少填写一项成长数据");
          return null;
        }

        return {
          ...common,
          type,
          payload,
        };
      }
      case "sleep": {
        const startTimestamp = parseDateTimeInput(sleepStartDate, sleepStartTime);
        const endTimestamp = parseDateTimeInput(sleepEndDate, sleepEndTime);

        if (startTimestamp === undefined) {
          setError("请选择有效的睡眠开始时间");
          return null;
        }

        if (endTimestamp === undefined) {
          setError("请选择有效的睡眠结束时间");
          return null;
        }

        if (endTimestamp < startTimestamp) {
          setError("睡眠结束时间不能早于开始时间");
          return null;
        }

        const startTime = combineDateTime(sleepStartDate, sleepStartTime);
        const endTime = combineDateTime(sleepEndDate, sleepEndTime);

        return {
          ...common,
          type,
          occurredAt: startTime,
          payload: {
            startTime,
            endTime,
            quality: sleepQuality,
            note: trimToUndefined(note),
          },
        };
      }
      case "vaccine": {
        const name = vaccineName.trim();
        if (!name) {
          setError("请输入疫苗名称");
          return null;
        }

        return {
          ...common,
          type,
          title: name,
          payload: {
            vaccineName: name,
            dose: trimToUndefined(vaccineDose),
            scheduledDate: trimToUndefined(scheduledDate),
            completedDate: trimToUndefined(completedDate),
            location: trimToUndefined(vaccineLocation),
          },
        };
      }
      case "milestone": {
        const category = milestoneCategory.trim();
        const description = milestoneDescription.trim();
        if (!category || !description) {
          setError("请填写里程碑分类和描述");
          return null;
        }

        return {
          ...common,
          type,
          title: category,
          payload: {
            category,
            description,
          },
        };
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSavingRef.current) {
      return;
    }

    setError(null);
    const draft = buildDraft();

    if (draft) {
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        await onSave(draft);
      } catch {
        setError("保存失败，请重试");
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }
  }

  return (
    <form className="rounded-card border border-line bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="记录类型">
        {recordTypeOrder.map((recordType) => {
          const meta = recordMeta[recordType];
          const Icon = meta.icon;
          const isActive = type === recordType;

          return (
            <button
              key={recordType}
              type="button"
              aria-pressed={isActive}
              disabled={isSaving}
              onClick={() => {
                setType(recordType);
                setError(null);
              }}
              className={`flex min-h-10 items-center gap-2 rounded-card border px-3 text-sm font-medium transition ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-ink hover:border-primary/50 hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={labelClassName()}>
          记录日期
          <input
            className={fieldClassName()}
            type="date"
            value={date}
            aria-describedby={errorId}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className={labelClassName()}>
          记录时间
          <input
            className={fieldClassName()}
            type="time"
            value={time}
            aria-describedby={errorId}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4">{renderTypeFields()}</div>

      <label className={`mt-4 block ${labelClassName()}`}>
        备注
        <textarea
          className={`${fieldClassName()} min-h-20 resize-y`}
          value={note}
          aria-describedby={errorId}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {error ? (
        <p id="record-composer-error" className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="min-h-10 rounded-card border border-line bg-white px-4 text-sm font-medium text-ink hover:border-primary/50 hover:text-primary"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-10 rounded-card bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
        >
          {isSaving ? "保存中" : "保存"}
        </button>
      </div>
    </form>
  );

  function renderTypeFields() {
    switch (type) {
      case "journal":
        return (
          <label className={labelClassName()}>
            日记内容
            <textarea
              className={`${fieldClassName()} min-h-28 resize-y`}
              value={journalBody}
              aria-describedby={errorId}
              onChange={(event) => setJournalBody(event.target.value)}
            />
          </label>
        );
      case "photo":
        return (
          <label className={labelClassName()}>
            照片说明
            <input
              className={fieldClassName()}
              type="text"
              value={photoCaption}
              aria-describedby={errorId}
              onChange={(event) => setPhotoCaption(event.target.value)}
            />
          </label>
        );
      case "growth":
        return (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClassName()}>
              身高 cm
              <input
                className={fieldClassName()}
                inputMode="decimal"
                min="0"
                step="0.1"
                type="number"
                value={heightCm}
                aria-describedby={errorId}
                onChange={(event) => setHeightCm(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              体重 kg
              <input
                className={fieldClassName()}
                inputMode="decimal"
                min="0"
                step="0.1"
                type="number"
                value={weightKg}
                aria-describedby={errorId}
                onChange={(event) => setWeightKg(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              头围 cm
              <input
                className={fieldClassName()}
                inputMode="decimal"
                min="0"
                step="0.1"
                type="number"
                value={headCircumferenceCm}
                aria-describedby={errorId}
                onChange={(event) => setHeadCircumferenceCm(event.target.value)}
              />
            </label>
          </div>
        );
      case "sleep":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName()}>
              入睡日期
              <input
                className={fieldClassName()}
                type="date"
                value={sleepStartDate}
                aria-describedby={errorId}
                onChange={(event) => setSleepStartDate(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              入睡时间
              <input
                className={fieldClassName()}
                type="time"
                value={sleepStartTime}
                aria-describedby={errorId}
                onChange={(event) => setSleepStartTime(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              醒来日期
              <input
                className={fieldClassName()}
                type="date"
                value={sleepEndDate}
                aria-describedby={errorId}
                onChange={(event) => setSleepEndDate(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              醒来时间
              <input
                className={fieldClassName()}
                type="time"
                value={sleepEndTime}
                aria-describedby={errorId}
                onChange={(event) => setSleepEndTime(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              睡眠状态
              <select
                className={fieldClassName()}
                value={sleepQuality}
                aria-describedby={errorId}
                onChange={(event) => setSleepQuality(event.target.value as SleepPayload["quality"])}
              >
                <option value="good">安稳</option>
                <option value="normal">普通</option>
                <option value="restless">易醒</option>
              </select>
            </label>
          </div>
        );
      case "vaccine":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName()}>
              疫苗名称
              <input
                className={fieldClassName()}
                type="text"
                value={vaccineName}
                aria-describedby={errorId}
                onChange={(event) => setVaccineName(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              剂次
              <input
                className={fieldClassName()}
                type="text"
                value={vaccineDose}
                aria-describedby={errorId}
                onChange={(event) => setVaccineDose(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              计划日期
              <input
                className={fieldClassName()}
                type="date"
                value={scheduledDate}
                aria-describedby={errorId}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              完成日期
              <input
                className={fieldClassName()}
                type="date"
                value={completedDate}
                aria-describedby={errorId}
                onChange={(event) => setCompletedDate(event.target.value)}
              />
            </label>
            <label className={labelClassName()}>
              接种地点
              <input
                className={fieldClassName()}
                type="text"
                value={vaccineLocation}
                aria-describedby={errorId}
                onChange={(event) => setVaccineLocation(event.target.value)}
              />
            </label>
          </div>
        );
      case "milestone":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName()}>
              分类
              <input
                className={fieldClassName()}
                type="text"
                value={milestoneCategory}
                aria-describedby={errorId}
                onChange={(event) => setMilestoneCategory(event.target.value)}
              />
            </label>
            <label className={`sm:col-span-2 ${labelClassName()}`}>
              描述
              <textarea
                className={`${fieldClassName()} min-h-24 resize-y`}
                value={milestoneDescription}
                aria-describedby={errorId}
                onChange={(event) => setMilestoneDescription(event.target.value)}
              />
            </label>
          </div>
        );
    }
  }
}
