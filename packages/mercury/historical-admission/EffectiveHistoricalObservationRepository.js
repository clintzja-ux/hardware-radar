import{projectEffectiveHistoricalObservation}from"./HistoricalComparabilityReassessment.js";
export class EffectiveHistoricalObservationRepository{
 constructor({historicalRepository,reassessmentRepository}={}){if(!historicalRepository?.getAll||!reassessmentRepository?.getAllReassessments)throw new TypeError("EFFECTIVE_HISTORICAL_REPOSITORY_DEPENDENCIES_REQUIRED");Object.assign(this,{historicalRepository,reassessmentRepository})}
 async getAll(){const[rows,reassessments]=await Promise.all([this.historicalRepository.getAll(),this.reassessmentRepository.getAllReassessments()]);return Object.freeze(rows.map(x=>projectEffectiveHistoricalObservation(x,reassessments)))}
 async getById(id){const rows=await this.getAll();return rows.find(x=>x.observationId===id)??null}
}

