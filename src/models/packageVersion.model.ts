import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Report } from './report.model';

@Entity()
export class PackageVersion extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() packageName: string;
    @Column() version: string;

    @OneToOne(type => Report, { eager: true })
    @JoinColumn()
    report: Report;
}