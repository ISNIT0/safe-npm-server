import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Review } from './review.model';

@Entity()
export class PackageVersion extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() packageName: string;
    @Column() version: string;
    @Column() automaticTestStatus: 'created' | 'started' | 'failed' | 'passed' | 'cancelled';
    @ManyToOne(type => Review, review => review.packageVersion) reviews: Review[];
}