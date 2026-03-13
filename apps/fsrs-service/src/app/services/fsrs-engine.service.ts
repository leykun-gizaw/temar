import { Injectable } from '@nestjs/common';
import {
  fsrs,
  createEmptyCard,
  type FSRS,
  type Card,
  type CardInput,
  type RecordLogItem,
  type Grade,
  Rating,
} from 'ts-fsrs';

@Injectable()
export class FsrsEngineService {
  private readonly f: FSRS;

  constructor() {
    this.f = fsrs();
  }

  createCard(): Card {
    return createEmptyCard();
  }

  getSchedulingOptions(card: CardInput, now: Date = new Date()) {
    return this.f.repeat(card, now);
  }

  applyRating(
    card: CardInput,
    rating: Grade,
    now: Date = new Date()
  ): RecordLogItem {
    const preview = this.f.repeat(card, now);
    return preview[rating];
  }

  getRetrievability(card: CardInput, now: Date = new Date()): number {
    const r = this.f.get_retrievability(card, now);
    return typeof r === 'string' ? parseFloat(r) || 0 : r ?? 0;
  }

  get ratingEnum() {
    return Rating;
  }
}
